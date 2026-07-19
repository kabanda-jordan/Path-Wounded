import api from './client'
import type { ApiResponse, Carrier, Review } from '../types'

export const carriersApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Carrier[]>>('/carriers', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Carrier>>(`/carriers/${id}`),

  create: (data: { name: string; location?: string }) =>
    api.post<ApiResponse<Carrier>>('/carriers', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Carrier>>(`/carriers/${id}`, data),

  top: (limit: number = 10) =>
    api.get<ApiResponse<Carrier[]>>('/carriers/top', { params: { limit: String(limit) } }),

  getReviews: (carrierId: string, params?: Record<string, string>) =>
    api.get<ApiResponse<Review[]>>(`/carriers/${carrierId}/reviews`, { params }),

  createReview: (carrierId: string, data: { rating: number; comment?: string; orderId?: string }) =>
    api.post<ApiResponse<Review>>(`/carriers/${carrierId}/reviews`, data),
}
