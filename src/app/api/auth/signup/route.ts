import { NextRequest } from 'next/server'

const EDGE_URL = process.env.EDGE_FUNCTION_URL!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const edgeResponse = await fetch(`${EDGE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: process.env.NEXT_PUBLIC_SUPABASE_URL! },
      body: JSON.stringify(body),
    })

    const data = await edgeResponse.json()
    return Response.json(data, { status: edgeResponse.status })
  } catch {
    return Response.json(
      { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to connect to auth service' } },
      { status: 502 }
    )
  }
}
