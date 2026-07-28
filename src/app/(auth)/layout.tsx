'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/context/AuthContext'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, finishLoading } = useAuthStore()

  useEffect(() => {
    finishLoading()
  }, [finishLoading])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard/overview')
    }
  }, [isLoading, isAuthenticated, router])

  return <>{children}</>
}
