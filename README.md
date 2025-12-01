# Wampeewo Ntakke SS Digital Library - Admin Panel

A secure, production-ready admin panel for managing the Wampeewo Ntakke SS Digital Library built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Secure Authentication**: Admin-only access with Supabase Auth
- 📚 **Book Management**: Full CRUD operations for books
- 📤 **Secure File Upload**: Server-side file uploads with Supabase Edge Functions
- 🔍 **Search & Filtering**: Advanced search and filtering capabilities
- 📊 **Analytics Dashboard**: Visualizations and insights
- 📱 **Responsive Design**: Mobile-friendly interface
- 🛡️ **Row-Level Security**: RLS policies for data protection
- 📝 **Audit Logging**: Complete audit trail of admin actions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Vercel (Frontend), Supabase (Backend)
- **Testing**: Jest (Unit), Playwright (E2E)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (project ymghaubrramiysgiqbnj)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wnss-admin-panel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

Run the following SQL in your Supabase SQL Editor:

```sql
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
```

### 4. Create Storage Bucket

Create a bucket named `books` in your Supabase Storage settings. Set it to private for better security.

### 5. Create Admin User

1. Create a Supabase Auth user or use the signup form
2. Add the user's profile with admin role:

```sql
-- Replace 'your-auth-user-uuid-here' with the actual user ID from auth.users
INSERT INTO public.profiles (id, full_name, role)
VALUES ('your-auth-user-uuid-here', 'Admin User', 'admin');
```

### 6. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required environment variables:

```env
# Frontend (Vercel/Netlify)
NEXT_PUBLIC_SUPABASE_URL=https://ymghaubrramiysgiqbnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Edge Functions (Supabase Functions)
SUPABASE_URL=https://ymghaubrramiysgiqbnj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
UPLOAD_MAX_BYTES=104857600
ALLOWED_ORIGINS=https://your-admin-domain.com
```

### 7. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Link to your project
supabase link --project-ref ymghaubrramiysgiqbnj

# Deploy functions
supabase functions deploy upload-and-insert
supabase functions deploy delete-book-and-files
```

### 8. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase (Backend)

1. Edge Functions are already deployed
2. Database is hosted on Supabase
3. Storage is configured

## Security Features

- **Row-Level Security**: Only admins can modify books
- **Server-side Upload**: Files uploaded using service role key
- **JWT Validation**: All Edge Functions validate admin role
- **Audit Logging**: All actions tracked in `book_changes` table
- **CORS Protection**: Limited to admin domain
- **File Size Limits**: Configurable maximum upload size

## API Endpoints

### Edge Functions

#### Upload and Insert Book
```
POST /functions/v1/upload-and-insert
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Body:
- title (string, required)
- author (string, optional)
- subject (string, optional)
- level (string, optional)
- class_level (string, optional)
- description (string, optional)
- featured (boolean, optional)
- pdf (file, required)
- cover (file, optional)
```

#### Delete Book and Files
```
POST /functions/v1/delete-book-and-files
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "book_id": "uuid",
  "confirm": true
}
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Project Structure

```
wnss-admin-panel/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable React components
│   ├── lib/                # Utilities and configurations
│   └── styles/             # Global styles
├── supabase/
│   └── functions/          # Edge Functions
├── sql/                    # Database setup scripts
├── tests/
│   ├── unit/              # Unit tests
│   └── e2e/               # E2E tests
└── public/                # Static assets
```

## Acceptance Criteria

✅ **Authentication**: Admin-only access with role verification
✅ **Book CRUD**: Create, read, update, delete books
✅ **File Upload**: Secure PDF and cover image uploads
✅ **Search & Filter**: Advanced book discovery
✅ **Analytics**: Dashboard with insights
✅ **Audit Trail**: Complete action logging
✅ **Responsive Design**: Works on all devices
✅ **Security**: RLS, JWT validation, server-side uploads

## Troubleshooting

### Common Issues

1. **Admin Access Denied**
   - Ensure user has profile with role='admin'
   - Check RLS policies are correctly applied

2. **File Upload Fails**
   - Verify Supabase Storage bucket exists
   - Check service role key is correct
   - Ensure file size is within limits

3. **Edge Function Errors**
   - Check environment variables in Supabase
   - Verify CORS settings
   - Review function logs in Supabase dashboard

### Getting Help

1. Check Supabase logs for errors
2. Review browser console for client-side issues
3. Verify all environment variables are set
4. Ensure database permissions are correct

## Maintenance

### Regular Tasks

- Monitor storage usage in Supabase
- Review audit logs for suspicious activity
- Update dependencies regularly
- Backup database (handled by Supabase)

### Security Checklist

- [ ] Service role key never exposed to client
- [ ] CORS limited to admin domain
- [ ] All admin actions logged
- [ ] File size limits enforced
- [ ] JWT validation in all functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is proprietary to Wampeewo Ntakke Secondary School.

## Support

For technical support, please contact the development team or create an issue in the repository.
