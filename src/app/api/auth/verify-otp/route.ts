import { NextRequest, NextResponse } from 'next/server'

const EDGE_URL = process.env.EDGE_FUNCTION_URL!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const edgeResponse = await fetch(`${EDGE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: process.env.NEXT_PUBLIC_SUPABASE_URL! },
      body: JSON.stringify(body),
    })

    const data = await edgeResponse.json()

    if (!edgeResponse.ok || !data.success) {
      return NextResponse.json(data, { status: edgeResponse.status })
    }

    const { accessToken } = data.data

    const response = NextResponse.json(data, { status: 200 })

    const isSecure = process.env.NODE_ENV === 'production'
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isSecure,
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
          secure: isSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        })
      }
    }

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to connect to auth service' } },
      { status: 502 }
    )
  }
}
