import { supabase, createServiceClient } from '@/lib/supabase'

// Mock environment variables
const originalEnv = process.env

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('creates client with public configuration', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const client = supabase
    expect(client).toBeDefined()
    expect(client.supabaseUrl).toBe('https://test.supabase.co')
  })

  it('creates service client with service role key', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

    const serviceClient = createServiceClient()
    expect(serviceClient).toBeDefined()
    expect(serviceClient.supabaseUrl).toBe('https://test.supabase.co')
  })

  it('throws error when environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => supabase).toThrow()
  })
})
