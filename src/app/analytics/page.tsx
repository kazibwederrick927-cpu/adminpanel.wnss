'use client'

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Database } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { BookOpen, TrendingUp, Calendar, Users, BarChart3, PieChart } from 'lucide-react'

type Book = Database['public']['Tables']['books']['Row']
type BookChange = Database['public']['Tables']['book_changes']['Row']

interface AnalyticsData {
  totalBooks: number
  featuredBooks: number
  totalSubjects: number
  totalLevels: number
  uploadsThisWeek: number
  uploadsThisMonth: number
  topBooks: Book[]
  recentChanges: BookChange[]
  subjectDistribution: { subject: string; count: number }[]
  levelDistribution: { level: string; count: number }[]
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Get basic book stats
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*')

      if (booksError) throw booksError

      // Get recent changes
      const { data: changes, error: changesError } = await supabase
        .from('book_changes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (changesError) throw changesError

      // Calculate analytics
      const totalBooks = books?.length || 0
      const featuredBooks = books?.filter(book => book.featured).length || 0
      const subjects = [...new Set(books?.map(book => book.subject).filter(Boolean))]
      const levels = [...new Set(books?.map(book => book.level).filter(Boolean))]
      const totalSubjects = subjects.length
      const totalLevels = levels.length

      // Calculate uploads this week and month
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const uploadsThisWeek = books?.filter(book => 
        new Date(book.upload_date) >= weekAgo
      ).length || 0

      const uploadsThisMonth = books?.filter(book => 
        new Date(book.upload_date) >= monthAgo
      ).length || 0

      // Get top books by popularity
      const topBooks = books
        ?.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
        .slice(0, 10) || []

      // Subject distribution
      const subjectCount: { [key: string]: number } = {}
      books?.forEach(book => {
        if (book.subject) {
          subjectCount[book.subject] = (subjectCount[book.subject] || 0) + 1
        }
      })
      const subjectDistribution = Object.entries(subjectCount)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)

      // Level distribution
      const levelCount: { [key: string]: number } = {}
      books?.forEach(book => {
        if (book.level) {
          levelCount[book.level] = (levelCount[book.level] || 0) + 1
        }
      })
      const levelDistribution = Object.entries(levelCount)
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count)

      setData({
        totalBooks,
        featuredBooks,
        totalSubjects,
        totalLevels,
        uploadsThisWeek,
        uploadsThisMonth,
        topBooks,
        recentChanges: changes || [],
        subjectDistribution,
        levelDistribution,
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-primary text-xl">Loading analytics...</div>
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Analytics Unavailable</h1>
          <p className="text-gray-400">Unable to load analytics data</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-2">Overview of your digital library</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Books</p>
                <p className="text-2xl font-semibold text-white">{data.totalBooks}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Featured Books</p>
                <p className="text-2xl font-semibold text-white">{data.featuredBooks}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Subjects</p>
                <p className="text-2xl font-semibold text-white">{data.totalSubjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Levels</p>
                <p className="text-2xl font-semibold text-white">{data.totalLevels}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-2xl font-semibold text-white">{data.uploadsThisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-semibold text-white">{data.uploadsThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Books */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Top Books by Popularity</h2>
            <div className="space-y-3">
              {data.topBooks.length === 0 ? (
                <p className="text-gray-400">No books available</p>
              ) : (
                data.topBooks.map((book, index) => (
                  <div key={book.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-primary font-semibold">#{index + 1}</span>
                      <div>
                        <p className="text-white font-medium">{book.title}</p>
                        <p className="text-sm text-gray-400">{book.author || 'Unknown author'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-semibold">{book.popularity_score || 0}</p>
                      <p className="text-xs text-gray-400">score</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject Distribution */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Subject Distribution</h2>
            <div className="space-y-3">
              {data.subjectDistribution.length === 0 ? (
                <p className="text-gray-400">No subjects available</p>
              ) : (
                data.subjectDistribution.map(({ subject, count }) => (
                  <div key={subject} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <span className="text-white">{subject}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(count / data.totalBooks) * 100}%` }}
                        />
                      </div>
                      <span className="text-primary font-semibold">{count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Level Distribution */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Level Distribution</h2>
            <div className="space-y-3">
              {data.levelDistribution.length === 0 ? (
                <p className="text-gray-400">No levels available</p>
              ) : (
                data.levelDistribution.map(({ level, count }) => (
                  <div key={level} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <span className="text-white">{level}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(count / data.totalBooks) * 100}%` }}
                        />
                      </div>
                      <span className="text-primary font-semibold">{count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Changes */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {data.recentChanges.length === 0 ? (
                <p className="text-gray-400">No recent activity</p>
              ) : (
                data.recentChanges.map((change) => (
                  <div key={change.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div>
                      <p className="text-white capitalize">{change.action}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(change.created_at).toLocaleDateString()} at {new Date(change.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      change.action === 'create' ? 'bg-green-600 text-white' :
                      change.action === 'update' ? 'bg-blue-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {change.action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
