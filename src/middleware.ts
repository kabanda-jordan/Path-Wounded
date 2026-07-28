import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const token = request.cookies.get('accessToken')?.value

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Session expired' } },
            { status: 401 }
          )
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
