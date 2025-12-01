'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Database } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'

type Book = Database['public']['Tables']['books']['Row']

const SUBJECTS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Economics',
  'Literature',
  'Computer Science',
  'Religious Education',
  'General Paper',
]

const LEVELS = ['O-Level', 'A-Level']
const CLASSES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

export default function EditBook() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    level: '',
    class_level: '',
    description: '',
    featured: false,
  })

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

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
      setFormData({
        title: data.title || '',
        author: data.author || '',
        subject: data.subject || '',
        level: data.level || '',
        class_level: data.class_level || '',
        description: data.description || '',
        featured: data.featured || false,
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch book')
      router.push('/dashboard')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type === 'application/pdf') {
      setPdfFile(file)
    } else if (file.type.startsWith('image/')) {
      setCoverFile(file)
    } else {
      toast.error('Please upload a PDF file or an image')
    }
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0])
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0])
    }
  }

  const removePdf = () => setPdfFile(null)
  const removeCover = () => setCoverFile(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error('Title is required')
      return
    }

    setLoading(true)

    try {
      // If we have new files, use the upload function
      if (pdfFile || coverFile) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          toast.error('Not authenticated')
          return
        }

        // Create form data for multipart upload
        const formDataToSend = new FormData()
        formDataToSend.append('title', formData.title)
        formDataToSend.append('author', formData.author)
        formDataToSend.append('subject', formData.subject)
        formDataToSend.append('level', formData.level)
        formDataToSend.append('class_level', formData.class_level)
        formDataToSend.append('description', formData.description)
        formDataToSend.append('featured', formData.featured.toString())
        
        if (pdfFile) {
          formDataToSend.append('pdf', pdfFile)
        }
        if (coverFile) {
          formDataToSend.append('cover', coverFile)
        }

        // For updates, we need to modify the upload function or create a new one
        // For now, let's update metadata and handle files separately
        toast.info('File upload for updates requires additional implementation')
      }

      // Update book metadata
      const { error: updateError } = await supabase
        .from('books')
        .update({
          title: formData.title,
          author: formData.author || null,
          subject: formData.subject || null,
          level: formData.level || null,
          class_level: formData.class_level || null,
          description: formData.description || null,
          featured: formData.featured,
        })
        .eq('id', bookId)

      if (updateError) throw updateError

      // Create audit log
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase
          .from('book_changes')
          .insert({
            book_id: bookId,
            admin_id: session.user.id,
            action: 'update',
            changes: {
              title: formData.title,
              author: formData.author,
              subject: formData.subject,
              level: formData.level,
              class_level: formData.class_level,
              description: formData.description,
              featured: formData.featured,
            }
          })
      }

      toast.success('Book updated successfully!')
      router.push(`/books/${bookId}`)
      
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update book')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href={`/books/${bookId}`}
            className="flex items-center text-gray-400 hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Book
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white">Edit Book</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-900 p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter book title"
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-2">
                Author
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter author name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-2">
                  Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select level</option>
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="class_level" className="block text-sm font-medium text-gray-300 mb-2">
                Class
              </label>
              <select
                id="class_level"
                name="class_level"
                value={formData.class_level}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select class</option>
                {CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter book description (optional)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-gray-300">
                Featured book
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-gray-900 p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold text-white">Update Files</h2>
            <p className="text-sm text-gray-400">
              Leave empty to keep existing files. Upload new files to replace them.
            </p>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PDF File (leave empty to keep current)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-gray-800' : 'border-gray-700'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {pdfFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Upload className="h-8 w-8 text-primary" />
                      <span className="text-white">{pdfFile.name}</span>
                      <button
                        type="button"
                        onClick={removePdf}
                        className="text-red-500 hover:text-red-400"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-400">
                      Drag and drop new PDF file here, or click to select
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="inline-block px-4 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400 cursor-pointer"
                    >
                      Select New PDF File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Image (leave empty to keep current)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-gray-800' : 'border-gray-700'
                }`}
              >
                {coverFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Upload className="h-8 w-8 text-primary" />
                      <span className="text-white">{coverFile.name}</span>
                      <button
                        type="button"
                        onClick={removeCover}
                        className="text-red-500 hover:text-red-400"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400">
                      {(coverFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-400">
                      Drag and drop new cover image here, or click to select
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="inline-block px-4 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 cursor-pointer"
                    >
                      Select New Cover Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/books/${bookId}`}
              className="px-6 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Book'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
