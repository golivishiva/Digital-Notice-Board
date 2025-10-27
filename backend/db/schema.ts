import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

// Users table with role-based access
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role').notNull(), // 'admin', 'staff', 'student'
    department: text('department'), // For staff and students
    isVerified: integer('is_verified', { mode: 'boolean' }).default(false).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique').on(t.email),
    usernameUnique: uniqueIndex('users_username_unique').on(t.username),
    roleIdx: index('users_role_idx').on(t.role),
  })
)

// Sessions table
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    idUnique: uniqueIndex('sessions_id_unique').on(t.id),
    userIdIdx: index('sessions_user_id_idx').on(t.userId),
  })
)

// Notices table
export const notices = sqliteTable(
  'notices',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    summary: text('summary'), // AI-generated summary
    category: text('category').notNull(), // 'exams', 'events', 'holidays', 'sports', 'general', 'emergency'
    authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    department: text('department'), // Target department or null for all
    isPinned: integer('is_pinned', { mode: 'boolean' }).default(false).notNull(),
    isApproved: integer('is_approved', { mode: 'boolean' }).default(false).notNull(),
    isArchived: integer('is_archived', { mode: 'boolean' }).default(false).notNull(),
    publishAt: integer('publish_at', { mode: 'timestamp' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    viewCount: integer('view_count').default(0).notNull(),
    likeCount: integer('like_count').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    categoryIdx: index('notices_category_idx').on(t.category),
    authorIdx: index('notices_author_idx').on(t.authorId),
    publishIdx: index('notices_publish_idx').on(t.publishAt),
    pinnedIdx: index('notices_pinned_idx').on(t.isPinned),
    approvedIdx: index('notices_approved_idx').on(t.isApproved),
  })
)

// Notice attachments (files stored in R2)
export const attachments = sqliteTable(
  'attachments',
  {
    id: text('id').primaryKey(),
    noticeId: text('notice_id').notNull().references(() => notices.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(), // 'pdf', 'image', 'video'
    fileSize: integer('file_size').notNull(),
    r2Key: text('r2_key').notNull(), // Key in R2 bucket
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    noticeIdx: index('attachments_notice_idx').on(t.noticeId),
  })
)

// Notice interactions (likes, bookmarks, acknowledgments)
export const interactions = sqliteTable(
  'interactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    noticeId: text('notice_id').notNull().references(() => notices.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'view', 'like', 'bookmark', 'acknowledge'
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    userNoticeIdx: index('interactions_user_notice_idx').on(t.userId, t.noticeId),
    typeIdx: index('interactions_type_idx').on(t.type),
  })
)

// Comments on notices
export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    noticeId: text('notice_id').notNull().references(() => notices.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    noticeIdx: index('comments_notice_idx').on(t.noticeId),
    userIdx: index('comments_user_idx').on(t.userId),
  })
)

// Activity logs for audit tracking
export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // 'login', 'logout', 'create_notice', 'delete_user', etc.
    entityType: text('entity_type'), // 'notice', 'user', 'comment', etc.
    entityId: text('entity_id'),
    metadata: text('metadata'), // JSON string
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    userIdx: index('activity_logs_user_idx').on(t.userId),
    actionIdx: index('activity_logs_action_idx').on(t.action),
    createdIdx: index('activity_logs_created_idx').on(t.createdAt),
  })
)

// Email verification tokens
export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    type: text('type').notNull(), // 'email_verification', 'password_reset'
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    tokenUnique: uniqueIndex('verification_tokens_token_unique').on(t.token),
    userIdx: index('verification_tokens_user_idx').on(t.userId),
  })
)

// Notifications for push/email alerts
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    noticeId: text('notice_id').references(() => notices.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type').notNull(), // 'notice', 'comment', 'emergency', 'system'
    isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    userIdx: index('notifications_user_idx').on(t.userId),
    readIdx: index('notifications_read_idx').on(t.isRead),
  })
)
