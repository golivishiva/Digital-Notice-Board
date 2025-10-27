import type { Hono } from 'hono'
import { and, eq, desc, sql, or, like, lte, gte, isNull } from 'drizzle-orm'
import { getDb, type Bindings } from '../db/db'
import { notices, attachments, interactions, comments, users, notifications } from '../db/schema'
import { getCurrentUser } from './auth'
import { randomId } from '../db/utils/crypto'

type App = Hono<{ Bindings: Bindings }>

// Simple AI categorization (keyword-based)
function autoCategorizeNotice(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase()
  
  if (text.match(/exam|test|quiz|assessment|midterm|final/)) return 'exams'
  if (text.match(/holiday|vacation|break|off|closed/)) return 'holidays'
  if (text.match(/sport|match|game|tournament|athletic/)) return 'sports'
  if (text.match(/event|fest|celebration|ceremony|workshop|seminar|conference/)) return 'events'
  if (text.match(/urgent|emergency|immediate|critical|alert/)) return 'emergency'
  
  return 'general'
}

// Simple AI summarization (first 150 chars)
function generateSummary(content: string): string {
  const cleaned = content.replace(/<[^>]*>/g, '').trim()
  if (cleaned.length <= 150) return cleaned
  return cleaned.substring(0, 147) + '...'
}

export default (app: App) => {
  // Create notice
  app.post('/api/notices', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      if (user.role !== 'admin' && user.role !== 'staff') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const body = await c.req.json()
      const { title, content, category, department, publishAt, expiresAt, isPinned } = body

      if (!title || !content) {
        return c.json({ error: 'Title and content are required' }, 400)
      }

      const db = getDb(c.env)
      const noticeId = randomId('notice')
      const now = new Date()

      // Auto-categorize if not provided
      const finalCategory = category || autoCategorizeNotice(title, content)
      
      // Generate AI summary
      const summary = generateSummary(content)

      await db.insert(notices).values({
        id: noticeId,
        title,
        content,
        summary,
        category: finalCategory,
        authorId: user.id,
        department: department || null,
        isPinned: isPinned || false,
        isApproved: user.role === 'admin', // Auto-approve for admin
        isArchived: false,
        publishAt: publishAt ? new Date(publishAt) : now,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ id: noticeId, message: 'Notice created successfully' })
    } catch (error) {
      console.error('Create notice error:', error)
      return c.json({ error: 'Failed to create notice' }, 500)
    }
  })

  // Get notices (with filters)
  app.get('/api/notices', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const db = getDb(c.env)
      const category = c.req.query('category')
      const department = c.req.query('department')
      const search = c.req.query('search')
      const pinned = c.req.query('pinned')
      const archived = c.req.query('archived') === 'true'
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '20')
      const offset = (page - 1) * limit

      const now = new Date()
      const conditions = []

      // Base conditions
      if (user.role === 'student') {
        // Students only see approved, published, non-archived notices
        conditions.push(eq(notices.isApproved, true))
        conditions.push(eq(notices.isArchived, false))
        conditions.push(lte(notices.publishAt, now))
      } else if (user.role === 'staff') {
        // Staff see their own + approved notices
        if (!archived) {
          conditions.push(
            or(
              eq(notices.authorId, user.id),
              eq(notices.isApproved, true)
            )
          )
          conditions.push(eq(notices.isArchived, false))
        }
      }
      // Admin sees all

      if (archived) {
        conditions.push(eq(notices.isArchived, true))
      }

      if (category) {
        conditions.push(eq(notices.category, category))
      }

      if (department && department !== 'all') {
        conditions.push(
          or(
            eq(notices.department, department),
            isNull(notices.department)
          )
        )
      }

      if (pinned) {
        conditions.push(eq(notices.isPinned, true))
      }

      if (search) {
        conditions.push(
          or(
            like(notices.title, `%${search}%`),
            like(notices.content, `%${search}%`)
          )
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const noticesList = await db
        .select({
          notice: notices,
          author: {
            id: users.id,
            fullName: users.fullName,
            role: users.role,
            department: users.department,
          },
        })
        .from(notices)
        .leftJoin(users, eq(notices.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(notices.isPinned), desc(notices.publishAt))
        .limit(limit)
        .offset(offset)

      return c.json(noticesList)
    } catch (error) {
      console.error('Get notices error:', error)
      return c.json({ error: 'Failed to get notices' }, 500)
    }
  })

  // Get single notice
  app.get('/api/notices/:id', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const noticeId = c.req.param('id')
      const db = getDb(c.env)

      const result = await db
        .select({
          notice: notices,
          author: {
            id: users.id,
            fullName: users.fullName,
            role: users.role,
            department: users.department,
          },
        })
        .from(notices)
        .leftJoin(users, eq(notices.authorId, users.id))
        .where(eq(notices.id, noticeId))
        .limit(1)

      if (!result.length) {
        return c.json({ error: 'Notice not found' }, 404)
      }

      // Increment view count and log interaction
      await db
        .update(notices)
        .set({ viewCount: sql`${notices.viewCount} + 1` })
        .where(eq(notices.id, noticeId))

      // Log view interaction
      try {
        await db.insert(interactions).values({
          id: randomId('int'),
          userId: user.id,
          noticeId,
          type: 'view',
          createdAt: new Date(),
        })
      } catch (e) {
        // Ignore duplicate view logs
      }

      // Get attachments
      const noticeAttachments = await db
        .select()
        .from(attachments)
        .where(eq(attachments.noticeId, noticeId))

      // Get user interactions
      const userInteractions = await db
        .select()
        .from(interactions)
        .where(and(eq(interactions.noticeId, noticeId), eq(interactions.userId, user.id)))

      return c.json({
        ...result[0],
        attachments: noticeAttachments,
        userInteractions: userInteractions.map(i => i.type),
      })
    } catch (error) {
      console.error('Get notice error:', error)
      return c.json({ error: 'Failed to get notice' }, 500)
    }
  })

  // Update notice
  app.put('/api/notices/:id', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const noticeId = c.req.param('id')
      const db = getDb(c.env)

      // Check permission
      const existing = await db.select().from(notices).where(eq(notices.id, noticeId)).limit(1)
      
      if (!existing.length) {
        return c.json({ error: 'Notice not found' }, 404)
      }

      if (user.role !== 'admin' && existing[0].authorId !== user.id) {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const body = await c.req.json()
      const { title, content, category, department, publishAt, expiresAt, isPinned, isArchived } = body

      const updates: any = {
        updatedAt: new Date(),
      }

      if (title) updates.title = title
      if (content) {
        updates.content = content
        updates.summary = generateSummary(content)
      }
      if (category) updates.category = category
      if (department !== undefined) updates.department = department
      if (publishAt) updates.publishAt = new Date(publishAt)
      if (expiresAt) updates.expiresAt = new Date(expiresAt)
      if (isPinned !== undefined) updates.isPinned = isPinned
      if (isArchived !== undefined) updates.isArchived = isArchived

      await db.update(notices).set(updates).where(eq(notices.id, noticeId))

      return c.json({ message: 'Notice updated successfully' })
    } catch (error) {
      console.error('Update notice error:', error)
      return c.json({ error: 'Failed to update notice' }, 500)
    }
  })

  // Delete notice
  app.delete('/api/notices/:id', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const noticeId = c.req.param('id')
      const db = getDb(c.env)

      const existing = await db.select().from(notices).where(eq(notices.id, noticeId)).limit(1)
      
      if (!existing.length) {
        return c.json({ error: 'Notice not found' }, 404)
      }

      if (user.role !== 'admin' && existing[0].authorId !== user.id) {
        return c.json({ error: 'Permission denied' }, 403)
      }

      await db.delete(notices).where(eq(notices.id, noticeId))

      return c.json({ message: 'Notice deleted successfully' })
    } catch (error) {
      console.error('Delete notice error:', error)
      return c.json({ error: 'Failed to delete notice' }, 500)
    }
  })

  // Approve notice (admin only)
  app.post('/api/notices/:id/approve', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Permission denied' }, 403)
      }

      const noticeId = c.req.param('id')
      const db = getDb(c.env)

      await db.update(notices).set({ isApproved: true }).where(eq(notices.id, noticeId))

      return c.json({ message: 'Notice approved successfully' })
    } catch (error) {
      console.error('Approve notice error:', error)
      return c.json({ error: 'Failed to approve notice' }, 500)
    }
  })

  // Toggle interaction (like, bookmark, acknowledge)
  app.post('/api/notices/:id/interact', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const noticeId = c.req.param('id')
      const body = await c.req.json()
      const { type } = body // 'like', 'bookmark', 'acknowledge'

      if (!['like', 'bookmark', 'acknowledge'].includes(type)) {
        return c.json({ error: 'Invalid interaction type' }, 400)
      }

      const db = getDb(c.env)

      // Check if interaction exists
      const existing = await db
        .select()
        .from(interactions)
        .where(
          and(
            eq(interactions.userId, user.id),
            eq(interactions.noticeId, noticeId),
            eq(interactions.type, type)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        // Remove interaction
        await db
          .delete(interactions)
          .where(eq(interactions.id, existing[0].id))

        if (type === 'like') {
          await db
            .update(notices)
            .set({ likeCount: sql`${notices.likeCount} - 1` })
            .where(eq(notices.id, noticeId))
        }

        return c.json({ action: 'removed' })
      } else {
        // Add interaction
        await db.insert(interactions).values({
          id: randomId('int'),
          userId: user.id,
          noticeId,
          type,
          createdAt: new Date(),
        })

        if (type === 'like') {
          await db
            .update(notices)
            .set({ likeCount: sql`${notices.likeCount} + 1` })
            .where(eq(notices.id, noticeId))
        }

        return c.json({ action: 'added' })
      }
    } catch (error) {
      console.error('Interaction error:', error)
      return c.json({ error: 'Failed to process interaction' }, 500)
    }
  })

  // Get comments for a notice
  app.get('/api/notices/:id/comments', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const noticeId = c.req.param('id')
      const db = getDb(c.env)

      const commentsList = await db
        .select({
          comment: comments,
          user: {
            id: users.id,
            fullName: users.fullName,
            role: users.role,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.noticeId, noticeId))
        .orderBy(desc(comments.createdAt))

      return c.json(commentsList)
    } catch (error) {
      console.error('Get comments error:', error)
      return c.json({ error: 'Failed to get comments' }, 500)
    }
  })

  // Add comment
  app.post('/api/notices/:id/comments', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const noticeId = c.req.param('id')
      const body = await c.req.json()
      const { content } = body

      if (!content || content.trim().length === 0) {
        return c.json({ error: 'Comment content is required' }, 400)
      }

      const db = getDb(c.env)
      const commentId = randomId('comment')
      const now = new Date()

      await db.insert(comments).values({
        id: commentId,
        noticeId,
        userId: user.id,
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      })

      // Update comment count
      await db
        .update(notices)
        .set({ commentCount: sql`${notices.commentCount} + 1` })
        .where(eq(notices.id, noticeId))

      return c.json({ id: commentId, message: 'Comment added successfully' })
    } catch (error) {
      console.error('Add comment error:', error)
      return c.json({ error: 'Failed to add comment' }, 500)
    }
  })

  // Get analytics
  app.get('/api/notices/analytics/stats', async (c) => {
    try {
      const user = await getCurrentUser(c)
      if (!user) {
        return c.json({ error: 'Not authenticated' }, 401)
      }

      const db = getDb(c.env)

      // Total notices by category
      const categoryStats = await db
        .select({
          category: notices.category,
          count: sql<number>`count(*)`,
        })
        .from(notices)
        .where(eq(notices.isApproved, true))
        .groupBy(notices.category)

      // Total engagement
      const totalViews = await db
        .select({ total: sql<number>`sum(${notices.viewCount})` })
        .from(notices)

      const totalLikes = await db
        .select({ total: sql<number>`sum(${notices.likeCount})` })
        .from(notices)

      const totalComments = await db
        .select({ total: sql<number>`sum(${notices.commentCount})` })
        .from(notices)

      // Recent notices
      const recentNotices = await db
        .select({
          id: notices.id,
          title: notices.title,
          category: notices.category,
          viewCount: notices.viewCount,
          likeCount: notices.likeCount,
          commentCount: notices.commentCount,
          publishAt: notices.publishAt,
        })
        .from(notices)
        .where(eq(notices.isApproved, true))
        .orderBy(desc(notices.publishAt))
        .limit(5)

      return c.json({
        categoryStats,
        engagement: {
          totalViews: totalViews[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0,
          totalComments: totalComments[0]?.total || 0,
        },
        recentNotices,
      })
    } catch (error) {
      console.error('Analytics error:', error)
      return c.json({ error: 'Failed to get analytics' }, 500)
    }
  })
}
