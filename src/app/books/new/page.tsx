'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'

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

export default function NewBook() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
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
    
    if (!formData.title || !pdfFile) {
      toast.error('Title and PDF file are required')
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
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
      formDataToSend.append('pdf', pdfFile)
      if (coverFile) {
        formDataToSend.append('cover', coverFile)
      }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })
      })

      xhr.open('POST', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-and-insert`)
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.send(formDataToSend)

      const result = await uploadPromise
      
      toast.success('Book uploaded successfully!')
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload book')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-400 hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white">Add New Book</h1>

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
            <h2 className="text-xl font-semibold text-white">Files</h2>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PDF File *
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
                      Drag and drop PDF file here, or click to select
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
                      Select PDF File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Image (optional)
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
                      Drag and drop cover image here, or click to select
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
                      Select Cover Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Uploading...</span>
                <span className="text-sm text-gray-300">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !pdfFile}
              className="px-6 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Upload Book'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
