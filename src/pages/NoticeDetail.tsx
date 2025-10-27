import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  CheckCircle,
  User,
  Calendar,
  ArrowLeft,
  Trash2,
  Check,
  Clock,
} from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types'

export default function NoticeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notice, setNotice] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [interactions, setInteractions] = useState<string[]>([])

  useEffect(() => {
    fetchNotice()
    fetchComments()
  }, [id])

  const fetchNotice = async () => {
    try {
      const response = await fetch(`/api/notices/${id}`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setNotice(data.notice)
        setInteractions(data.userInteractions || [])
      } else {
        navigate('/notices')
      }
    } catch (error) {
      console.error('Failed to fetch notice:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/notices/${id}/comments`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleInteraction = async (type: string) => {
    try {
      const response = await fetch(`/api/notices/${id}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include',
      })

      if (response.ok) {
        fetchNotice()
      }
    } catch (error) {
      console.error('Failed to interact:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/notices/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
        credentials: 'include',
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
        fetchNotice()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this notice?')) return

    try {
      const response = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        navigate('/notices')
      }
    } catch (error) {
      console.error('Failed to delete notice:', error)
    }
  }

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/notices/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        fetchNotice() // Refresh to show updated status
      }
    } catch (error) {
      console.error('Failed to approve notice:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!notice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Notice not found</h2>
        </div>
      </DashboardLayout>
    )
  }

  const canDelete = user?.role === 'admin' || notice.authorId === user?.id
  const canApprove = user?.role === 'admin' && !notice.isApproved

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="notice-detail-page">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/notices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notices
        </Button>

        {/* Approval alert for pending notices */}
        {!notice.isApproved && (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {user?.role === 'admin' 
                ? 'This notice is pending approval. Review and approve to publish it to all users.'
                : 'This notice is pending admin approval before it will be visible to students.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Notice Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${CATEGORY_COLORS[notice.category]} text-white`}>
                    {CATEGORY_LABELS[notice.category]}
                  </Badge>
                  {notice.isPinned && (
                    <Badge variant="outline">Pinned</Badge>
                  )}
                  {!notice.isApproved && (
                    <Badge variant="secondary">Pending Approval</Badge>
                  )}
                </div>
                <CardTitle className="text-3xl mb-4">{notice.title}</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{notice.author?.fullName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(notice.publishAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {canApprove && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="approve-button"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Notice
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6">
              <p className="whitespace-pre-wrap">{notice.content}</p>
            </div>

            <Separator className="my-6" />

            {/* Interaction buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                variant={interactions.includes('like') ? 'default' : 'outline'}
                onClick={() => handleInteraction('like')}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Like ({notice.likeCount})
              </Button>

              <Button
                variant={interactions.includes('bookmark') ? 'default' : 'outline'}
                onClick={() => handleInteraction('bookmark')}
                className="flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                {interactions.includes('bookmark') ? 'Bookmarked' : 'Bookmark'}
              </Button>

              <Button
                variant={interactions.includes('acknowledge') ? 'default' : 'outline'}
                onClick={() => handleInteraction('acknowledge')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {interactions.includes('acknowledge') ? 'Acknowledged' : 'Acknowledge'}
              </Button>

              <div className="flex items-center gap-2 text-gray-600 ml-auto">
                <Eye className="w-4 h-4" />
                <span>{notice.viewCount} views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({notice.commentCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="space-y-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button type="submit" disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </form>

            <Separator />

            {/* Comments list */}
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((item) => (
                  <div key={item.comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {item.user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{item.user?.fullName || 'Unknown'}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {item.user?.role}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{item.comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
