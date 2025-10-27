import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { BarChart3, TrendingUp, Eye, ThumbsUp, MessageSquare, FileText } from 'lucide-react'

export default function Analytics() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      navigate('/dashboard')
      return
    }
    fetchStats()
  }, [])

  const fetchStats = async () => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="analytics-page">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Notice board statistics and engagement metrics
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Engagement Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.engagement?.totalViews || 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Across all notices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.engagement?.totalLikes || 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Student engagement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.engagement?.totalComments || 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Active discussions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Category Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Notices by Category
                </CardTitle>
                <CardDescription>Distribution of notices across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.categoryStats && stats.categoryStats.length > 0 ? (
                    stats.categoryStats.map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="font-medium capitalize">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full"
                              style={{
                                width: `${(cat.count / stats.categoryStats.reduce((sum: number, c: any) => sum + c.count, 0)) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{cat.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Notices Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Notices Performance
                </CardTitle>
                <CardDescription>Top performing notices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentNotices && stats.recentNotices.length > 0 ? (
                    stats.recentNotices.map((notice: any) => (
                      <div key={notice.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{notice.title}</h4>
                          <p className="text-sm text-gray-600">
                            Published: {formatDate(notice.publishAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {notice.viewCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {notice.likeCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {notice.commentCount}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No notices available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
