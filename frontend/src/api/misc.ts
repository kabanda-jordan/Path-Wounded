import api from './client'
import type { ApiResponse, Message } from '../types'

export const messagesApi = {
  getThreads: () =>
    api.get<ApiResponse<Message[]>>('/messages/threads'),

  getThread: (threadId: string) =>
    api.get<ApiResponse<Message[]>>(`/messages/threads/${threadId}`),

  send: (data: { recipientId: string; body: string; threadId?: string }) =>
    api.post<ApiResponse<Message>>('/messages', data),

  markRead: (threadId: string) =>
    api.post<ApiResponse<{ message: string }>>(`/messages/threads/${threadId}/read`),

  unreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/messages/unread-count'),
}

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get<ApiResponse<import('../types').Notification[]>>('/notifications', { params: { unreadOnly: String(unreadOnly) } }),

  unreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markRead: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post<ApiResponse<{ message: string }>>('/notifications/mark-all-read'),
}

export const automationsApi = {
  list: () =>
    api.get<ApiResponse<import('../types').Automation[]>>('/automations'),

  get: (id: string) =>
    api.get<ApiResponse<import('../types').Automation>>(`/automations/${id}`),

  create: (data: { name: string; triggerType: string; actionType: string; config?: Record<string, unknown> }) =>
    api.post<ApiResponse<import('../types').Automation>>('/automations', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<import('../types').Automation>>(`/automations/${id}`, data),

  toggle: (id: string) =>
    api.post<ApiResponse<import('../types').Automation>>(`/automations/${id}/toggle`),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/automations/${id}`),
}

export const usersApi = {
  getProfile: () =>
    api.get<ApiResponse<import('../types').User>>('/users/profile'),

  updateProfile: (data: { fullName?: string; companyName?: string }) =>
    api.patch<ApiResponse<import('../types').User>>('/users/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>('/users/change-password', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post<ApiResponse<{ id: string; avatarUrl: string }>>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const reportingApi = {
  carrierPerformance: () =>
    api.get<ApiResponse<Record<string, unknown>[]>>('/reporting/carriers'),

  exportCarriersCsv: async () => {
    const response = await api.get('/reporting/carriers/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'carrier-performance.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  },
}
