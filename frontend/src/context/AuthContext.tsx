import { create } from 'zustand'
import type { User } from '../types'
import { setAccessToken } from '../api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  finishLoading: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    setAccessToken(token)
  },
  logout: () => {
    setAccessToken(null)
    set({ user: null, isAuthenticated: false })
  },
  finishLoading: () => set({ isLoading: false }),
}))
