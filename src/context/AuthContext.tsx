'use client'

import { create } from 'zustand'
import type { Profile } from '@/types'

interface AuthState {
  user: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: Profile | null) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
  finishLoading: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  fetchUser: async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success && data.data) {
        set({ user: data.data, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors
    }
    set({ user: null, isAuthenticated: false })
  },

  finishLoading: () => set({ isLoading: false }),
}))
