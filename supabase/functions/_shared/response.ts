import { getOrigin } from "./middleware.ts"

export function sendSuccess(req: Request, data: unknown, status = 200, meta?: Record<string, unknown>): Response {
  const body: Record<string, unknown> = { success: true, data }
  if (meta) body.meta = meta
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getOrigin(req), "Content-Type": "application/json" },
  })
}

export function sendError(req: Request, status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: { ...getOrigin(req), "Content-Type": "application/json" } }
  )
}

export function parsePagination(url: URL): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) }
}

export function parseJsonBody(req: Request): Record<string, unknown> | null {
  try {
    const body = req.body
    if (!body) return {}
    return {} // We'll use req.json() instead
  } catch {
    return null
  }
}

export function parsePaginationFromUrl(req: Request) {
  const url = new URL(req.url)
  return parsePagination(url)
}
