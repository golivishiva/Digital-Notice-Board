import type { Hono } from 'hono'
import { and, eq, desc, sql, or, like, isNotNull } from 'drizzle-orm'
import { getDb, type Bindings } from '../db/db'
import { users, activityLogs, notices } from '../db/schema'
import { getCurrentUser } from './auth'
import { hashPassword, generateSalt, randomId } from '../db/utils/crypto'

type App = Hono<{ Bindings: Bindings }>

export default (app: App) => {
  // Get all users (admin only)
  app.get('/api/admin/users', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const db = getDb(c.env)
      const role = c.req.query('role')
      const search = c.req.query('search')
      const includeDeleted = c.req.query('includeDeleted') === 'true'
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '50')
      const offset = (page - 1) * limit

      const conditions = []

      if (!includeDeleted) {
        conditions.push(eq(users.isDeleted, false))
      }

      if (role) {
        conditions.push(eq(users.role, role))
      }

      if (search) {
        conditions.push(
          or(
            like(users.fullName, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.username, `%${search}%`)
          )
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const usersList = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          fullName: users.fullName,
          role: users.role,
          department: users.department,
          isVerified: users.isVerified,
          isActive: users.isActive,
          isDeleted: users.isDeleted,
          deletedAt: users.deletedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)

      return c.json({
        users: usersList,
        total: total[0].count,
        page,
        limit,
      })
    } catch (error) {
      console.error('Get users error:', error)
      return c.json({ error: 'Failed to get users' }, 500)
    }
  })

  // Create user (admin only)
  app.post('/api/admin/users', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const body = await c.req.json()
      const { email, username, password, fullName, role, department } = body

      if (!email || !username || !password || !fullName || !role) {
        return c.json({ error: 'All fields are required' }, 400)
      }

      if (!['admin', 'staff', 'student'].includes(role)) {
        return c.json({ error: 'Invalid role' }, 400)
      }

      const normalizedEmail = email.toLowerCase().trim()
      const normalizedUsername = username.toLowerCase().trim()
      const db = getDb(c.env)

      // Check duplicates
      const existing = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, normalizedEmail),
            eq(users.username, normalizedUsername)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        return c.json({ error: 'Email or username already exists' }, 400)
      }

      // Create user
      const salt = generateSalt()
      const hash = await hashPassword(password, salt)
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
        isVerified: true, // Admin-created users are auto-verified
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ id: userId, message: 'User created successfully' })
    } catch (error) {
      console.error('Create user error:', error)
      return c.json({ error: 'Failed to create user' }, 500)
    }
  })

  // Update user (admin only)
  app.put('/api/admin/users/:id', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const userId = c.req.param('id')
      const body = await c.req.json()
      const { fullName, role, department, isActive, isVerified } = body

      const db = getDb(c.env)
      const updates: any = {
        updatedAt: new Date(),
      }

      if (fullName) updates.fullName = fullName.trim()
      if (role) updates.role = role
      if (department !== undefined) updates.department = department
      if (isActive !== undefined) updates.isActive = isActive
      if (isVerified !== undefined) updates.isVerified = isVerified

      await db.update(users).set(updates).where(eq(users.id, userId))

      return c.json({ message: 'User updated successfully' })
    } catch (error) {
      console.error('Update user error:', error)
      return c.json({ error: 'Failed to update user' }, 500)
    }
  })

  // Soft delete user (admin only)
  app.delete('/api/admin/users/:id', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const userId = c.req.param('id')
      
      if (userId === admin.id) {
        return c.json({ error: 'Cannot delete your own account' }, 400)
      }

      const db = getDb(c.env)

      await db.update(users).set({
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      }).where(eq(users.id, userId))

      return c.json({ message: 'User deleted successfully' })
    } catch (error) {
      console.error('Delete user error:', error)
      return c.json({ error: 'Failed to delete user' }, 500)
    }
  })

  // Restore user (admin only)
  app.post('/api/admin/users/:id/restore', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const userId = c.req.param('id')
      const db = getDb(c.env)

      await db.update(users).set({
        isDeleted: false,
        isActive: true,
        deletedAt: null,
      }).where(eq(users.id, userId))

      return c.json({ message: 'User restored successfully' })
    } catch (error) {
      console.error('Restore user error:', error)
      return c.json({ error: 'Failed to restore user' }, 500)
    }
  })

  // Permanently delete user (admin only)
  app.delete('/api/admin/users/:id/permanent', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const userId = c.req.param('id')
      const db = getDb(c.env)

      // Check if user is soft-deleted
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
      if (!user.length) {
        return c.json({ error: 'User not found' }, 404)
      }

      if (!user[0].isDeleted) {
        return c.json({ error: 'User must be soft-deleted first' }, 400)
      }

      await db.delete(users).where(eq(users.id, userId))

      return c.json({ message: 'User permanently deleted' })
    } catch (error) {
      console.error('Permanent delete error:', error)
      return c.json({ error: 'Failed to permanently delete user' }, 500)
    }
  })

  // Get activity logs (admin only)
  app.get('/api/admin/logs', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const db = getDb(c.env)
      const action = c.req.query('action')
      const userId = c.req.query('userId')
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '100')
      const offset = (page - 1) * limit

      const conditions = []

      if (action) {
        conditions.push(eq(activityLogs.action, action))
      }

      if (userId) {
        conditions.push(eq(activityLogs.userId, userId))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const logs = await db
        .select({
          log: activityLogs,
          user: {
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            role: users.role,
          },
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset)

      return c.json(logs)
    } catch (error) {
      console.error('Get logs error:', error)
      return c.json({ error: 'Failed to get logs' }, 500)
    }
  })

  // Get dashboard stats (admin only)
  app.get('/api/admin/dashboard', async (c) => {
    try {
      const admin = await getCurrentUser(c)
      if (!admin || admin.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const db = getDb(c.env)

      // User stats
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users)
      const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true))
      const studentCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'student'))
      const staffCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'staff'))
      const adminCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'))

      // Notice stats
      const totalNotices = await db.select({ count: sql<number>`count(*)` }).from(notices)
      const approvedNotices = await db.select({ count: sql<number>`count(*)` }).from(notices).where(eq(notices.isApproved, true))
      const pendingNotices = await db.select({ count: sql<number>`count(*)` }).from(notices).where(eq(notices.isApproved, false))
      const archivedNotices = await db.select({ count: sql<number>`count(*)` }).from(notices).where(eq(notices.isArchived, true))

      // Recent activity
      const recentActivity = await db
        .select({
          log: activityLogs,
          user: {
            id: users.id,
            fullName: users.fullName,
            role: users.role,
          },
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(10)

      return c.json({
        users: {
          total: totalUsers[0].count,
          active: activeUsers[0].count,
          students: studentCount[0].count,
          staff: staffCount[0].count,
          admins: adminCount[0].count,
        },
        notices: {
          total: totalNotices[0].count,
          approved: approvedNotices[0].count,
          pending: pendingNotices[0].count,
          archived: archivedNotices[0].count,
        },
        recentActivity,
      })
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return c.json({ error: 'Failed to get dashboard stats' }, 500)
    }
  })
}
