import axios from 'axios'
import type { ApiResponse, Profile } from '@/types'

export interface LoginResponse {
  accessToken: string
  user: Profile
}

export interface OtpPendingResponse {
  pendingToken: string
  requiresOtp: boolean
  email: string
  fullName: string
  message: string
}

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  }
)

export const authApi = {
  signup: (data: { email: string; password: string; fullName: string; companyName?: string; role?: string }) =>
    api.post<ApiResponse<{ user: { id: string; email: string; fullName: string; role: string } }>>('/api/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<OtpPendingResponse>>('/api/auth/login', data),

  verifyOtp: (data: { pendingToken: string; code: string }) =>
    api.post<ApiResponse<LoginResponse>>('/api/auth/verify-otp', data),

  resendOtp: (data: { pendingToken: string }) =>
    api.post<ApiResponse<{ message: string; email: string }>>('/api/auth/resend-otp', data),

  logout: () =>
    api.post<ApiResponse<{ message: string }>>('/api/auth/logout'),

  getMe: () =>
    api.get<ApiResponse<Profile>>('/api/auth/me'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>('/api/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    api.get<ApiResponse<{ message: string }>>(`/api/auth/verify-email?token=${token}`),
}

export const carrierApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<import('@/types').Carrier[]>>('/api/carriers', { params }),

  get: (id: string) =>
    api.get<ApiResponse<import('@/types').Carrier>>(`/api/carriers/${id}`),

  create: (data: { name: string; location?: string }) =>
    api.post<ApiResponse<import('@/types').Carrier>>('/api/carriers', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<import('@/types').Carrier>>(`/api/carriers/${id}`, data),

  top: (limit: number = 10) =>
    api.get<ApiResponse<import('@/types').Carrier[]>>('/api/carriers/top', { params: { limit: String(limit) } }),

  getReviews: (carrierId: string, params?: Record<string, string>) =>
    api.get<ApiResponse<import('@/types').Review[]>>(`/api/carriers/${carrierId}/reviews`, { params }),

  createReview: (carrierId: string, data: { rating: number; comment?: string; orderId?: string }) =>
    api.post<ApiResponse<import('@/types').Review>>(`/api/carriers/${carrierId}/reviews`, data),
}

export const orderApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<import('@/types').Order[]>>('/api/orders', { params }),

  get: (id: string) =>
    api.get<ApiResponse<import('@/types').Order>>(`/api/orders/${id}`),

  create: (data: { originAddress: string; destinationAddress: string; carrierId?: string; amountPaid?: number }) =>
    api.post<ApiResponse<import('@/types').Order>>('/api/orders', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<import('@/types').Order>>(`/api/orders/${id}`, data),

  cancel: (id: string) =>
    api.post<ApiResponse<import('@/types').Order>>(`/api/orders/${id}/cancel`),

  stats: () =>
    api.get<ApiResponse<import('@/types').OverviewStats>>('/api/orders/stats'),
}

export const invoiceApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<import('@/types').Invoice[]>>('/api/invoices', { params }),

  get: (id: string) =>
    api.get<ApiResponse<import('@/types').Invoice>>(`/api/invoices/${id}`),

  create: (data: { orderId: string; carrierId: string; amount: number; dueDate: string }) =>
    api.post<ApiResponse<import('@/types').Invoice>>('/api/invoices', data),

  markPaid: (id: string) =>
    api.post<ApiResponse<import('@/types').Invoice>>(`/api/invoices/${id}/mark-paid`),

  detectOverdue: () =>
    api.post<ApiResponse<{ updated: number }>>('/api/invoices/detect-overdue'),
}

export const miscApi = {
  messages: {
    getThreads: () =>
      api.get<ApiResponse<import('@/types').Message[]>>('/api/messages/threads'),

    getThread: (threadId: string) =>
      api.get<ApiResponse<import('@/types').Message[]>>(`/api/messages/threads/${threadId}`),

    send: (data: { recipientId: string; body: string; threadId?: string }) =>
      api.post<ApiResponse<import('@/types').Message>>('/api/messages', data),

    markRead: (threadId: string) =>
      api.post<ApiResponse<{ message: string }>>(`/api/messages/threads/${threadId}/read`),

    unreadCount: () =>
      api.get<ApiResponse<{ count: number }>>('/api/messages/unread-count'),
  },

  notifications: {
    list: (unreadOnly = false) =>
      api.get<ApiResponse<import('@/types').Notification[]>>('/api/notifications', { params: { unreadOnly: String(unreadOnly) } }),

    unreadCount: () =>
      api.get<ApiResponse<{ count: number }>>('/api/notifications/unread-count'),

    markRead: (id: string) =>
      api.post<ApiResponse<{ message: string }>>(`/api/notifications/${id}/read`),

    markAllRead: () =>
      api.post<ApiResponse<{ message: string }>>('/api/notifications/mark-all-read'),
  },

  automations: {
    list: () =>
      api.get<ApiResponse<import('@/types').Automation[]>>('/api/automations'),

    get: (id: string) =>
      api.get<ApiResponse<import('@/types').Automation>>(`/api/automations/${id}`),

    create: (data: { name: string; triggerType: string; actionType: string; config?: Record<string, unknown> }) =>
      api.post<ApiResponse<import('@/types').Automation>>('/api/automations', data),

    update: (id: string, data: Record<string, unknown>) =>
      api.patch<ApiResponse<import('@/types').Automation>>(`/api/automations/${id}`, data),

    toggle: (id: string) =>
      api.post<ApiResponse<import('@/types').Automation>>(`/api/automations/${id}/toggle`),

    delete: (id: string) =>
      api.delete<ApiResponse<{ message: string }>>(`/api/automations/${id}`),
  },

  users: {
    getProfile: () =>
      api.get<ApiResponse<import('@/types').Profile>>('/api/users/profile'),

    updateProfile: (data: { fullName?: string; companyName?: string }) =>
      api.patch<ApiResponse<import('@/types').Profile>>('/api/users/profile', data),

    uploadAvatar: (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return api.post<ApiResponse<{ id: string; avatarUrl: string }>>('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      api.post<ApiResponse<{ message: string }>>('/api/users/change-password', data),
  },

  analytics: {
    overview: () =>
      api.get<ApiResponse<import('@/types').OverviewStats>>('/api/analytics/overview'),

    revenue: (range: string = '30d') =>
      api.get<ApiResponse<import('@/types').RevenueData[]>>('/api/analytics/revenue', { params: { range } }),

    vehicleBreakdown: () =>
      api.get<ApiResponse<import('@/types').VehicleBreakdownItem[]>>('/api/analytics/vehicle-breakdown'),

    orderStatusBreakdown: () =>
      api.get<ApiResponse<{ status: string; count: number; percentage: number }[]>>('/api/analytics/order-status-breakdown'),
  },

  reporting: {
    carrierPerformance: () =>
      api.get<ApiResponse<Record<string, unknown>[]>>('/api/reporting/carriers'),

    exportCarriersCsv: async () => {
      const response = await api.get('/api/reporting/carriers/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'carrier-performance.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
  },
}

export default api
