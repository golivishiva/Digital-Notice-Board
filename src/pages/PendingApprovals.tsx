import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Check, X, Eye, Clock, User, Calendar, AlertCircle } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_LABELS, type NoticeWithAuthor } from '../types'

export default function PendingApprovals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pendingNotices, setPendingNotices] = useState<NoticeWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchPendingNotices()
  }, [user])

  const fetchPendingNotices = async () => {
    setLoading(true)
    try {
      // Fetch all notices and filter for unapproved ones
      const response = await fetch('/api/notices?limit=100', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        const pending = data.filter((item: NoticeWithAuthor) => !item.notice.isApproved)
        setPendingNotices(pending)
      }
    } catch (error) {
      console.error('Failed to fetch pending notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (noticeId: string) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}/approve`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Remove from pending list
        setPendingNotices(pendingNotices.filter(item => item.notice.id !== noticeId))
      }
    } catch (error) {
      console.error('Failed to approve notice:', error)
    }
  }

  const handleReject = async (noticeId: string) => {
    if (!confirm('Are you sure you want to reject and delete this notice?')) return

    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setPendingNotices(pendingNotices.filter(item => item.notice.id !== noticeId))
      }
    } catch (error) {
      console.error('Failed to reject notice:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="pending-approvals-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pending Approvals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve notices submitted by staff members
          </p>
        </div>

        {/* Stats Card */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-orange-900">
                  {pendingNotices.length}
                </h3>
                <p className="text-sm text-orange-700">
                  {pendingNotices.length === 1 ? 'Notice awaiting' : 'Notices awaiting'} your approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading pending notices...</p>
          </div>
        ) : pendingNotices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Check className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no notices pending approval at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="pending-notices-list">
            {pendingNotices.map((item) => (
              <Card key={item.notice.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${CATEGORY_COLORS[item.notice.category]} text-white`}>
                          {CATEGORY_LABELS[item.notice.category]}
                        </Badge>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Pending Review
                        </Badge>
                        {item.notice.isPinned && (
                          <Badge variant="outline">Pinned</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{item.notice.title}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Submitted by {item.author?.fullName || 'Unknown'}</span>
                          <span className="text-xs text-gray-400 capitalize">({item.author?.role})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.notice.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                    {item.notice.summary || item.notice.content.substring(0, 200) + '...'}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(item.notice.id)}
                      data-testid={`approve-${item.notice.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/notices/${item.notice.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review Details
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(item.notice.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
