import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provides authentication context', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockProfile = { id: '123', role: 'admin', full_name: 'Test User' }

    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    })

    const TestComponent = () => {
      const { user, profile, loading } = AuthProvider.prototype.useAuth?.() || {}
      return (
        <div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div>
              <span data-testid="user-email">{user?.email}</span>
              <span data-testid="user-role">{profile?.role}</span>
            </div>
          )}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
    })
  })
})
