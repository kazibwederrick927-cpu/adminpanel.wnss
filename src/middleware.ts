import { createClient } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseResponse = createClient(request)

  const {
    data: { user },
  } = await supabaseResponse.supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/analytics')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/books/new')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/books/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users from login to dashboard
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
