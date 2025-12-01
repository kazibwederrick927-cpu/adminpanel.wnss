import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createBrowserClient(supabaseUrl!, supabaseKey!);

// For server-side operations (Edge Functions)
export const createServiceClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const { createClient } = require('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          subject: string | null
          class_level: string | null
          level: string | null
          description: string | null
          cover_url: string | null
          file_path: string | null
          language: string | null
          pages: number | null
          upload_date: string
          featured: boolean
          keywords: string[] | null
          popularity_score: number | null
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          subject?: string | null
          class_level?: string | null
          level?: string | null
          description?: string | null
          cover_url?: string | null
          file_path?: string | null
          language?: string | null
          pages?: number | null
          upload_date?: string
          featured?: boolean
          keywords?: string[] | null
          popularity_score?: number | null
        }
        Update: {
          id?: string
          title?: string
          author?: string | null
          subject?: string | null
          class_level?: string | null
          level?: string | null
          description?: string | null
          cover_url?: string | null
          file_path?: string | null
          language?: string | null
          pages?: number | null
          upload_date?: string
          featured?: boolean
          keywords?: string[] | null
          popularity_score?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
      }
      book_changes: {
        Row: {
          id: string
          book_id: string | null
          admin_id: string | null
          action: string
          changes: any
          created_at: string
        }
        Insert: {
          id?: string
          book_id?: string | null
          admin_id?: string | null
          action: string
          changes?: any
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string | null
          admin_id?: string | null
          action?: string
          changes?: any
          created_at?: string
        }
      }
    }
  }
}
