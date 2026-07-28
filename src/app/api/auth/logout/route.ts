import { NextRequest, NextResponse } from 'next/server'

const EDGE_URL = process.env.EDGE_FUNCTION_URL!

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    await fetch(`${EDGE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader, origin: process.env.NEXT_PUBLIC_SUPABASE_URL! },
    }).catch(() => {})
  } catch {
    // Ignore errors - we still clear local cookies
  }

  const response = NextResponse.json(
    { success: true, data: { message: 'Logged out successfully' } },
    { status: 200 }
  )

  const isSecure = process.env.NODE_ENV === 'production'
  response.cookies.set('accessToken', '', { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 0 })
  response.cookies.set('refreshToken', '', { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/', maxAge: 0 })

  return response
}
