import { PAGINATION_DEFAULTS } from '../config/constants.js'

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function parsePagination(query: { page?: string | number; limit?: string | number }): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '')) || PAGINATION_DEFAULTS.page)
  const limit = Math.min(
    PAGINATION_DEFAULTS.maxLimit,
    Math.max(1, parseInt(String(query.limit || '')) || PAGINATION_DEFAULTS.limit)
  )
  return { page, limit, skip: (page - 1) * limit }
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
