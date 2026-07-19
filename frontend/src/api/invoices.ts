import api from './client'
import type { ApiResponse, Invoice } from '../types'

export const invoicesApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Invoice[]>>('/invoices', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  create: (data: { orderId: string; carrierId: string; amount: number; dueDate: string }) =>
    api.post<ApiResponse<Invoice>>('/invoices', data),

  markPaid: (id: string) =>
    api.post<ApiResponse<Invoice>>(`/invoices/${id}/mark-paid`),

  detectOverdue: () =>
    api.post<ApiResponse<{ updated: number }>>('/invoices/detect-overdue'),
}
