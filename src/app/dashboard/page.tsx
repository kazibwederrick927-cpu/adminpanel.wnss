'use client'

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type Book = Database['public']['Tables']['books']['Row']

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const booksPerPage = 10

  useEffect(() => {
    fetchBooks()
  }, [searchTerm, filterLevel, filterSubject, currentPage])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .order('upload_date', { ascending: false })

      // Apply search
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
      }

      // Apply filters
      if (filterLevel) {
        query = query.eq('level', filterLevel)
      }

      if (filterSubject) {
        query = query.eq('subject', filterSubject)
      }

      // Apply pagination
      const from = (currentPage - 1) * booksPerPage
      const to = from + booksPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setBooks(data || [])
      setTotalPages(Math.ceil((count || 0) / booksPerPage))
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bookId: string, bookTitle: string) => {
    const confirmTitle = prompt(`Please type "${bookTitle}" to confirm deletion:`)
    if (confirmTitle !== bookTitle) {
      toast.error('Deletion cancelled - title did not match')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-book-and-files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            book_id: bookId,
            confirm: true,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete book')
      }

      toast.success('Book deleted successfully')
      fetchBooks()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete book')
    }
  }

  const subjects = [...new Set(books.map(book => book.subject).filter((v): v is string => Boolean(v)))]
  const levels = [...new Set(books.map(book => book.level).filter((v): v is string => Boolean(v)))]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <Link
            href="/books/new"
            className="flex items-center px-4 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Book
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Books</p>
                <p className="text-2xl font-semibold text-white">{books.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Featured</p>
                <p className="text-2xl font-semibold text-white">
                  {books.filter(book => book.featured).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Subjects</p>
                <p className="text-2xl font-semibold text-white">{subjects.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">Levels</p>
                <p className="text-2xl font-semibold text-white">{levels.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900 p-4 rounded-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={String(level)} value={String(level)}>{String(level)}</option>
              ))}
            </select>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={String(subject)} value={String(subject)}>{String(subject)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Books Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      No books found
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{book.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{book.author || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{book.subject || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{book.level || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          book.featured 
                            ? 'bg-primary text-black' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {book.featured ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/books/${book.id}`}
                          className="text-primary hover:text-cyan-400"
                        >
                          <Eye className="h-4 w-4 inline" />
                        </Link>
                        <Link
                          href={`/books/${book.id}/edit`}
                          className="text-primary hover:text-cyan-400"
                        >
                          <Edit className="h-4 w-4 inline" />
                        </Link>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * booksPerPage) + 1} to {Math.min(currentPage * booksPerPage, books.length)} of {books.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
