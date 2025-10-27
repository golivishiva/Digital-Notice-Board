export interface User {
  id: string
  email: string
  username: string
  fullName: string
  role: 'admin' | 'staff' | 'student'
  department?: string | null
  isVerified: boolean
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Notice {
  id: string
  title: string
  content: string
  summary?: string | null
  category: 'exams' | 'events' | 'holidays' | 'sports' | 'general' | 'emergency'
  authorId: string
  department?: string | null
  isPinned: boolean
  isApproved: boolean
  isArchived: boolean
  publishAt: string
  expiresAt?: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface NoticeWithAuthor {
  notice: Notice
  author: {
    id: string
    fullName: string
    role: string
    department?: string | null
  }
}

export interface Attachment {
  id: string
  noticeId: string
  fileName: string
  fileType: string
  fileSize: number
  r2Key: string
  uploadedAt: string
}

export interface Comment {
  id: string
  noticeId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CommentWithUser {
  comment: Comment
  user: {
    id: string
    fullName: string
    role: string
  }
}

export interface Notification {
  id: string
  userId: string
  noticeId?: string | null
  title: string
  message: string
  type: 'notice' | 'comment' | 'emergency' | 'system'
  isRead: boolean
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  metadata?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

export const CATEGORY_LABELS: Record<Notice['category'], string> = {
  exams: 'Exams',
  events: 'Events',
  holidays: 'Holidays',
  sports: 'Sports',
  general: 'General',
  emergency: 'Emergency',
}

export const CATEGORY_COLORS: Record<Notice['category'], string> = {
  exams: 'bg-blue-500',
  events: 'bg-purple-500',
  holidays: 'bg-green-500',
  sports: 'bg-orange-500',
  general: 'bg-gray-500',
  emergency: 'bg-red-500',
}
