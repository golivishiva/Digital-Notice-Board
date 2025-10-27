import type { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { and, eq, gt } from 'drizzle-orm'
import { getDb, type Bindings } from '../db/db'
import { users, sessions, activityLogs } from '../db/schema'
import { hashPassword, verifyPassword, generateSalt, randomId } from '../db/utils/crypto'

type App = Hono<{ Bindings: Bindings }>

const COOKIE_NAME = 'sid'
const SESSION_TTL_DAYS = 7

function computeExpiry(days: number) {
  return new Date(Date.now() + days * 864e5)
}

function isSecure(c: any) {
  try {
    return new URL(c.req.url).protocol === 'https:'
  } catch {
    return false
  }
}

// Get current authenticated user from session
export async function getCurrentUser(c: any) {
  const sessionId = getCookie(c, COOKIE_NAME)
  if (!sessionId) return null

  const db = getDb(c.env)
  const now = new Date()

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1)

  if (!result.length || result[0].user.isDeleted || !result[0].user.isActive) {
    return null
  }

  const { passwordHash, passwordSalt, ...userWithoutSecrets } = result[0].user
  return userWithoutSecrets
}

// Log activity
async function logActivity(
  c: any,
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: any
) {
  try {
    const db = getDb(c.env)
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const userAgent = c.req.header('user-agent') || 'unknown'

    await db.insert(activityLogs).values({
      id: randomId('log'),
      userId,
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export default (app: App) => {
  // Register new user
  app.post('/api/auth/register', async (c) => {
    try {
      const body = await c.req.json()
      const { email, username, password, fullName, role, department } = body

      // Validate inputs
      if (!email || !username || !password || !fullName || !role) {
        return c.json({ error: 'All fields are required' }, 400)
      }

      if (password.length < 6) {
        return c.json({ error: 'Password must be at least 6 characters' }, 400)
      }

      if (!['admin', 'staff', 'student'].includes(role)) {
        return c.json({ error: 'Invalid role' }, 400)
      }

      const normalizedEmail = email.toLowerCase().trim()
      const normalizedUsername = username.toLowerCase().trim()

      const db = getDb(c.env)

      // Check if email or username already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existingUsers.length > 0) {
        return c.json({ error: 'Email already registered' }, 400)
      }

      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, normalizedUsername))
        .limit(1)

      if (existingUsername.length > 0) {
        return c.json({ error: 'Username already taken' }, 400)
      }

      // Hash password
      const salt = generateSalt()
      const hash = await hashPassword(password, salt)

      // Create user
      const userId = randomId('user')
      const now = new Date()

      await db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash: hash,
        passwordSalt: salt,
        fullName: fullName.trim(),
        role,
        department: department?.trim() || null,
        isVerified: false,
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      })

      // Create session
      const sessionId = randomId('sess')
      const expiresAt = computeExpiry(SESSION_TTL_DAYS)

      await db.insert(sessions).values({
        id: sessionId,
        userId,
        expiresAt,
        createdAt: now,
      })

      // Set cookie
      setCookie(c, COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isSecure(c),
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      })

      // Log activity
      await logActivity(c, userId, 'register', 'user', userId)

      return c.json({
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        fullName: fullName.trim(),
        role,
        department: department?.trim() || null,
      })
    } catch (error) {
      console.error('Registration error:', error)
      return c.json({ error: 'Registration failed' }, 500)
    }
  })

  // Login
  app.post('/api/auth/login', async (c) => {
    try {
      const body = await c.req.json()
      const { email, password } = body

      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400)
      }

      const normalizedEmail = email.toLowerCase().trim()
      const db = getDb(c.env)

      // Find user
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existingUsers.length === 0 || existingUsers[0].isDeleted || !existingUsers[0].isActive) {
        return c.json({ error: 'Invalid email or password' }, 401)
      }

      const user = existingUsers[0]

      // Verify password
      const isValid = await verifyPassword(password, user.passwordSalt, user.passwordHash)
      if (!isValid) {
        return c.json({ error: 'Invalid email or password' }, 401)
      }

      // Create session
      const sessionId = randomId('sess')
      const expiresAt = computeExpiry(SESSION_TTL_DAYS)
      const now = new Date()

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt,
        createdAt: now,
      })

      // Set cookie
      setCookie(c, COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isSecure(c),
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      })

      // Log activity
      await logActivity(c, user.id, 'login', 'user', user.id)

      const { passwordHash, passwordSalt, ...userWithoutSecrets } = user
      return c.json(userWithoutSecrets)
    } catch (error) {
      console.error('Login error:', error)
      return c.json({ error: 'Login failed' }, 500)
    }
  })

  // Logout
  app.post('/api/auth/logout', async (c) => {
    try {
      const sessionId = getCookie(c, COOKIE_NAME)
      
      if (sessionId) {
        const db = getDb(c.env)
        const user = await getCurrentUser(c)
        
        // Delete session
        await db.delete(sessions).where(eq(sessions.id, sessionId))
        
        // Log activity
        if (user) {
          await logActivity(c, user.id, 'logout', 'user', user.id)
        }
      }

      // Clear cookie
      deleteCookie(c, COOKIE_NAME, {
        path: '/',
      })

      return c.json({ success: true })
    } catch (error) {
      console.error('Logout error:', error)
      return c.json({ error: 'Logout failed' }, 500)
    }
  })

  // Get current user
  app.get('/api/auth/me', async (c) => {
    try {
      const user = await getCurrentUser(c)
      
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      return c.json(user)
    } catch (error) {
      console.error('Get user error:', error)
      return c.json({ error: 'Failed to get user' }, 500)
    }
  })
}
