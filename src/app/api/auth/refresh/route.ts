import { NextRequest, NextResponse } from 'next/server'

const EDGE_URL = process.env.EDGE_FUNCTION_URL!

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    const edgeResponse = await fetch(`${EDGE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader, origin: process.env.NEXT_PUBLIC_SUPABASE_URL! },
    })

    const data = await edgeResponse.json()

    if (!edgeResponse.ok || !data.success) {
      return NextResponse.json(data, { status: edgeResponse.status })
    }

    const { accessToken } = data.data

    const response = NextResponse.json(data, { status: 200 })

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })

    const setCookie = edgeResponse.headers.get('set-cookie')
    if (setCookie) {
      const match = setCookie.match(/refreshToken=([^;]+)/)
      if (match) {
        response.cookies.set('refreshToken', match[1], {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        })
      }
    }

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to refresh session' } },
      { status: 502 }
    )
  }
}
