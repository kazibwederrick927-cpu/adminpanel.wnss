'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, BarChart3, Settings, LogOut, Users } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !profile || profile.role !== 'admin')) {
      router.push('/login')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'admin') {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-primary font-bold text-xl">
                WNSS Library
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/books/new"
                  className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Add Book
                </Link>
                <Link
                  href="/analytics"
                  className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Analytics
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                {profile.full_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-300 hover:text-primary p-2 rounded-md"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-2">
        <div className="flex space-x-4 overflow-x-auto">
          <Link
            href="/dashboard"
            className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
          >
            Dashboard
          </Link>
          <Link
            href="/books/new"
            className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
          >
            Add Book
          </Link>
          <Link
            href="/analytics"
            className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
          >
            Analytics
          </Link>
          <Link
            href="/settings"
            className="text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
