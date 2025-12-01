-- Enable uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- books (existing schema; ensure columns exist)
CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  author text,
  subject text,
  class_level text,
  level text,
  description text,
  cover_url text,
  file_path text,
  language text,
  pages integer,
  upload_date timestamptz DEFAULT now(),
  featured boolean DEFAULT false,
  keywords text[],
  popularity_score double precision DEFAULT 0
);

-- profiles mapping auth.users -> role
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text, -- 'admin', 'editor', etc.
  created_at timestamptz DEFAULT now()
);

-- audit table for admin actions
CREATE TABLE IF NOT EXISTS public.book_changes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid,
  admin_id uuid REFERENCES auth.users(id),
  action text, -- 'create' | 'update' | 'delete'
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row-Level Security on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- public read for books
CREATE POLICY "public_select_books" ON public.books
  FOR SELECT
  USING (true);

-- admins can insert books (INSERT uses WITH CHECK)
CREATE POLICY "admins_insert_books" ON public.books
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- admins can update books (use USING + WITH CHECK)
CREATE POLICY "admins_update_books" ON public.books
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- admins can delete books
CREATE POLICY "admins_delete_books" ON public.books
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Sample admin profile creation (uncomment and replace with actual user ID)
-- INSERT INTO public.profiles (id, full_name, role)
-- VALUES ('your-auth-user-uuid-here', 'Admin User', 'admin');
