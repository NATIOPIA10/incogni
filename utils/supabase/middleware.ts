import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes
  if (pathname === '/' || pathname === '/signup' || pathname === '/login') {
    return supabaseResponse
  }

  // Protected routes require authentication
  const isProtectedRoute = 
    pathname.startsWith('/radar') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/chat') || 
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/admin')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith('/admin') ? '/admin/login' : '/signup'
    return NextResponse.redirect(url)
  }

  // Admin route protection & Suspension check
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', user.id)
      .single()

    // Handle suspension
    if (profile?.is_suspended && pathname !== '/suspended') {
      const url = request.nextUrl.clone()
      url.pathname = '/suspended'
      return NextResponse.redirect(url)
    }

    // Handle admin access
    if (pathname.startsWith('/admin')) {
      if (!profile || !['moderator', 'admin', 'super_admin'].includes(profile.role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
