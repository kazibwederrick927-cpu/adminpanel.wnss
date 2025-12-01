'use client'

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Database } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import toast from 'react-hot-toast'
import { UserPlus, Users, Shield, Settings as SettingsIcon, LogOut, RefreshCw, User } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const [adminProfiles, setAdminProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchAdminProfiles()
  }, [])

  const fetchAdminProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAdminProfiles(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch admin profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteEmail) {
      toast.error('Email is required')
      return
    }

    setInviting(true)

    try {
      // Create auth user with magic link
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (inviteError) {
        // If admin.inviteUserByEmail is not available, use signUp
        const { error: signUpError } = await supabase.auth.signUp({
          email: inviteEmail,
          password: Math.random().toString(36).slice(-8), // Random password
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (signUpError) throw signUpError
      }

      toast.success('Invitation sent successfully!')
      setInviteEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveAdmin = async (profileId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', profileId)

      if (error) throw error

      toast.success('Admin removed successfully')
      fetchAdminProfiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove admin')
    }
  }

  const handleRefreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      toast.success('Session refreshed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh session')
    }
  }

  const handleSignOut = async () => {
    await signOut()
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your admin panel settings</p>
        </div>

        {/* User Info */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Your Profile
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="text-white">{profile?.full_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Role</p>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary text-black">
                {profile?.role}
              </span>
            </div>
            <div className="pt-4 flex space-x-4">
              <button
                onClick={handleRefreshSession}
                className="flex items-center px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Session
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Admin Management */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Admin Management
          </h2>
          
          {/* Invite Admin */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">Invite New Admin</h3>
            <form onSubmit={handleInviteAdmin} className="flex space-x-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={inviting}
                className="flex items-center px-4 py-2 bg-primary text-black font-medium rounded-md hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {inviting ? 'Inviting...' : 'Invite'}
              </button>
            </form>
          </div>

          {/* Admin List */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Current Admins</h3>
            <div className="space-y-3">
              {adminProfiles.length === 0 ? (
                <p className="text-gray-400">No admin profiles found</p>
              ) : (
                adminProfiles.map((adminProfile) => (
                  <div key={adminProfile.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-black font-semibold">
                          {(adminProfile.full_name || adminProfile.id).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {adminProfile.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-400">
                          Added: {new Date(adminProfile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-black">
                        Admin
                      </span>
                      {adminProfile.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveAdmin(adminProfile.id)}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            System Settings
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded">
              <h3 className="text-white font-medium mb-2">Storage Information</h3>
              <p className="text-sm text-gray-400">
                Books are stored in Supabase Storage under the &apos;books&apos; bucket.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Maximum file size: 100MB
              </p>
            </div>
            
            <div className="p-4 bg-gray-800 rounded">
              <h3 className="text-white font-medium mb-2">Security</h3>
              <p className="text-sm text-gray-400">
                • Row Level Security (RLS) is enabled on the books table
              </p>
              <p className="text-sm text-gray-400">
                • Only admins can create, update, or delete books
              </p>
              <p className="text-sm text-gray-400">
                • All admin actions are logged in the book_changes table
              </p>
            </div>

            <div className="p-4 bg-gray-800 rounded">
              <h3 className="text-white font-medium mb-2">Environment Variables</h3>
              <p className="text-sm text-gray-400">
                Make sure these are configured in your deployment:
              </p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                <li>• SUPABASE_URL (Edge Functions)</li>
                <li>• SUPABASE_SERVICE_ROLE_KEY (Edge Functions)</li>
                <li>• UPLOAD_MAX_BYTES</li>
                <li>• ALLOWED_ORIGINS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
