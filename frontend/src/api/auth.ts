import api from './client'
import type { ApiResponse, User } from '../types'

export interface LoginResponse {
  accessToken: string
  user: User
}

export const authApi = {
  signup: (data: { email: string; password: string; fullName: string; companyName?: string }) =>
    api.post<ApiResponse<{ user: { id: string; email: string; fullName: string; role: string } }>>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () =>
    api.post<ApiResponse<{ message: string }>>('/auth/logout'),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me'),

  verifyEmail: (token: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password }),
}
