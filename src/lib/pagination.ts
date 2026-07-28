interface PaginationParams {
  page: number
  limit: number
  offset: number
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function parsePagination(url: URL): PaginationParams {
  const searchParams = url.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
