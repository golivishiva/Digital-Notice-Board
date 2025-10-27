import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { FileText, Users, Eye, ThumbsUp, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_LABELS, type NoticeWithAuthor } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentNotices, setRecentNotices] = useState<NoticeWithAuthor[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats()
      fetchPendingCount()
    } else {
      fetchGeneralStats()
    }
    fetchRecentNotices()
  }, [user])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGeneralStats = async () => {
    try {
      const response = await fetch('/api/notices/analytics/stats', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentNotices = async () => {
    try {
      const response = await fetch('/api/notices?limit=5&pinned=true', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setRecentNotices(data)
      }
    } catch (error) {
      console.error('Failed to fetch recent notices:', error)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/notices?limit=100', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        const pending = data.filter((item: NoticeWithAuthor) => !item.notice.isApproved)
        setPendingCount(pending.length)
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening in your institution today.
          </p>
        </div>

        {/* Stats Cards */}
        {user?.role === 'admin' && stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.users?.active || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.notices?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.notices?.pending || 0} pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users?.students || 0}</div>
                <p className="text-xs text-muted-foreground">Registered students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users?.staff || 0}</div>
                <p className="text-xs text-muted-foreground">Faculty members</p>
              </CardContent>
            </Card>
          </div>
        )}

        {user?.role !== 'admin' && stats && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.engagement?.totalViews || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.engagement?.totalLikes || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.engagement?.totalComments || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pinned/Recent Notices */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-testid="recent-notices">
            <CardHeader>
              <CardTitle>Pinned Notices</CardTitle>
              <CardDescription>Important announcements</CardDescription>
            </CardHeader>
            <CardContent>
              {recentNotices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pinned notices at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentNotices.slice(0, 5).map((item) => (
                    <div
                      key={item.notice.id}
                      className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => navigate(`/notices/${item.notice.id}`)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${CATEGORY_COLORS[item.notice.category]}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {item.notice.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.author?.fullName} • {formatDate(item.notice.publishAt)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {item.notice.viewCount}
                          </span>
                          <span className="flex items-center">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {item.notice.likeCount}
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {item.notice.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/notices')}
              >
                View All Notices
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/notices/create')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create New Notice
                </Button>
              )}

              {user?.role === 'admin' && pendingCount > 0 && (
                <Button
                  className="w-full justify-start border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900"
                  variant="outline"
                  onClick={() => navigate('/admin/pending-approvals')}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Review Pending Notices
                  <span className="ml-auto bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                </Button>
              )}
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/notices')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Browse All Notices
              </Button>

              {user?.role === 'admin' && (
                <>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => navigate('/analytics')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
