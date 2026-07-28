import { NextResponse } from 'next/server'

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function sendSuccess<T>(data: T, status = 200, meta?: PaginationMeta) {
  const body: Record<string, unknown> = { success: true, data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status })
}

export function sendError(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}
