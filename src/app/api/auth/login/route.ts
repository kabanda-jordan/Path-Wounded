import { NextRequest } from 'next/server'

const EDGE_URL = process.env.EDGE_FUNCTION_URL!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const edgeResponse = await fetch(`${EDGE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: process.env.NEXT_PUBLIC_SUPABASE_URL! },
      body: JSON.stringify(body),
    })

    const data = await edgeResponse.json()
    
    const response = new Response(JSON.stringify(data), {
      status: edgeResponse.status,
      headers: { 'Content-Type': 'application/json' },
    })

    const setCookie = edgeResponse.headers.get('set-cookie')
    if (setCookie) {
      response.headers.set('set-cookie', setCookie)
    }

    return response
  } catch {
    return Response.json(
      { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to connect to auth service' } },
      { status: 502 }
    )
  }
}
