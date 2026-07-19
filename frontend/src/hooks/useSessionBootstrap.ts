import { useEffect } from 'react'
import { authApi, setAccessToken } from '../api/client'
import { useAuthStore } from '../context/AuthContext'

export function useSessionBootstrap() {
  const { setUser, finishLoading } = useAuthStore()

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const { data: refreshData } = await authApi.refresh()
        if (cancelled) return
        setAccessToken(refreshData.data.accessToken)

        const { data: meData } = await authApi.getMe()
        if (!cancelled) setUser(meData.data)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) finishLoading()
      }
    }

    bootstrap()
    return () => { cancelled = true }
  }, [setUser, finishLoading])
}
