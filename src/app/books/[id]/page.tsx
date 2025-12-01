'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Database } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Download, Calendar, User, BookOpen, Tag } from 'lucide-react'

type Book = Database['public']['Tables']['books']['Row']

export default function BookDetail() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

      if (error) throw error

      setBook(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch book')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!book) return

    const confirmTitle = prompt(`Please type "${book.title}" to confirm deletion:`)
    if (confirmTitle !== book.title) {
      toast.error('Deletion cancelled - title did not match')
      return
    }

    setDeleting(true)

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
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete book')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-primary text-xl">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!book) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Book not found</h1>
          <Link
            href="/dashboard"
            className="text-primary hover:text-cyan-400"
          >
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center text-gray-400 hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/books/${book.id}/edit`}
              className="flex items-center px-4 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Book Details */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Cover Image */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Information */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{book.title}</h1>
                {book.featured && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary text-black">
                    Featured
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {book.author && (
                  <div className="flex items-center text-gray-300">
                    <User className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{book.author}</span>
                  </div>
                )}

                {book.subject && (
                  <div className="flex items-center text-gray-300">
                    <BookOpen className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{book.subject}</span>
                  </div>
                )}

                {book.level && (
                  <div className="flex items-center text-gray-300">
                    <Tag className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{book.level}</span>
                  </div>
                )}

                {book.class_level && (
                  <div className="flex items-center text-gray-300">
                    <Tag className="h-5 w-5 mr-3 text-gray-400" />
                    <span>Class: {book.class_level}</span>
                  </div>
                )}

                {book.pages && (
                  <div className="flex items-center text-gray-300">
                    <BookOpen className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{book.pages} pages</span>
                  </div>
                )}

                <div className="flex items-center text-gray-300">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                  <span>
                    Uploaded: {new Date(book.upload_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {book.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300">{book.description}</p>
                </div>
              )}

              {book.keywords && book.keywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Section */}
        {book.file_path && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Download Book</h2>
            <a
              href={book.file_path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </a>
          </div>
        )}
      </div>
    </Layout>
  )
}
