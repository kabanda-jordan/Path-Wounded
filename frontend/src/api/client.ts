import axios from 'axios'
import type { ApiResponse, User } from '../types'

export interface LoginResponse {
  accessToken: string
  user: User
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = []

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(undefined)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        accessToken = data.data.accessToken
        processQueue(null)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        accessToken = null
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

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

export default api
