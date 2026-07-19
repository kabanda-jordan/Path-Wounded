import api from './client'
import type { ApiResponse, Order, OverviewStats, RevenueData, VehicleBreakdownItem } from '../types'

export const ordersApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Order[]>>('/orders', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: { originAddress: string; destinationAddress: string; carrierId?: string; amountPaid?: number }) =>
    api.post<ApiResponse<Order>>('/orders', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}`, data),

  cancel: (id: string) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/cancel`),

  stats: () =>
    api.get<ApiResponse<OverviewStats>>('/orders/stats'),
}

export const analyticsApi = {
  overview: () =>
    api.get<ApiResponse<OverviewStats>>('/analytics/overview'),

  revenue: (range: string = '30d') =>
    api.get<ApiResponse<RevenueData[]>>('/analytics/revenue', { params: { range } }),

  vehicleBreakdown: () =>
    api.get<ApiResponse<VehicleBreakdownItem[]>>('/analytics/vehicle-breakdown'),

  orderStatusBreakdown: () =>
    api.get<ApiResponse<{ status: string; count: number; percentage: number }[]>>('/analytics/order-status-breakdown'),
}
