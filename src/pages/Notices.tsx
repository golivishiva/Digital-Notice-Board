import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Search, Filter, Eye, ThumbsUp, MessageSquare, Pin, Calendar, User, FileText } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_LABELS, type NoticeWithAuthor } from '../types'

export default function Notices() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notices, setNotices] = useState<NoticeWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchNotices()
  }, [category, search])

  const fetchNotices = async () => {
    setLoading(true)
    try {
      let url = '/api/notices?limit=50'
      if (category && category !== 'all') {
        url += `&category=${category}`
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      const response = await fetch(url, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setNotices(data)
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNotices()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="notices-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notice Board</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage institutional notices
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search notices..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="notice-search"
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </form>

              {showFilters && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="exams">Exams</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="holidays">Holidays</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notices Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notices found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {search || category !== 'all' ? 'Try adjusting your filters' : 'No notices available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6" data-testid="notices-grid">
            {notices.map((item) => (
              <Card
                key={item.notice.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/notices/${item.notice.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${CATEGORY_COLORS[item.notice.category]} text-white`}>
                          {CATEGORY_LABELS[item.notice.category]}
                        </Badge>
                        {item.notice.isPinned && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </Badge>
                        )}
                        {!item.notice.isApproved && (
                          <Badge variant="secondary">Pending Approval</Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {item.notice.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {item.notice.summary || item.notice.content.substring(0, 150) + '...'}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{item.author?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.notice.publishAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{item.notice.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{item.notice.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{item.notice.commentCount}</span>
                    </div>
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
