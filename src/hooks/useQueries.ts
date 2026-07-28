import { useQuery } from '@tanstack/react-query'
import { orderApi, carrierApi, invoiceApi, miscApi } from '@/api/client'

export function useOverview() {
  return useQuery({ queryKey: ['analytics', 'overview'], queryFn: () => miscApi.analytics.overview() })
}

export function useRevenue(range: string = '30d') {
  return useQuery({ queryKey: ['analytics', 'revenue', range], queryFn: () => miscApi.analytics.revenue(range) })
}

export function useVehicleBreakdown() {
  return useQuery({ queryKey: ['analytics', 'vehicle-breakdown'], queryFn: () => miscApi.analytics.vehicleBreakdown() })
}

export function useOrderStatusBreakdown() {
  return useQuery({ queryKey: ['analytics', 'order-status'], queryFn: () => miscApi.analytics.orderStatusBreakdown() })
}

export function useTopCarriers(limit = 10) {
  return useQuery({ queryKey: ['carriers', 'top', limit], queryFn: () => carrierApi.top(limit) })
}

export function useOrders(params?: Record<string, string>) {
  return useQuery({ queryKey: ['orders', params], queryFn: () => orderApi.list(params) })
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['orders', id], queryFn: () => orderApi.get(id), enabled: !!id })
}

export function useCarriers(params?: Record<string, string>) {
  return useQuery({ queryKey: ['carriers', params], queryFn: () => carrierApi.list(params) })
}

export function useCarrier(id: string) {
  return useQuery({ queryKey: ['carriers', id], queryFn: () => carrierApi.get(id), enabled: !!id })
}

export function useInvoices(params?: Record<string, string>) {
  return useQuery({ queryKey: ['invoices', params], queryFn: () => invoiceApi.list(params) })
}

export function useMessages() {
  return useQuery({ queryKey: ['messages', 'threads'], queryFn: () => miscApi.messages.getThreads() })
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: () => miscApi.notifications.list(), refetchInterval: 30_000 })
}

export function useUnreadNotificationCount() {
  return useQuery({ queryKey: ['notifications', 'unread'], queryFn: () => miscApi.notifications.unreadCount(), refetchInterval: 15_000 })
}

export function useAutomations() {
  return useQuery({ queryKey: ['automations'], queryFn: () => miscApi.automations.list() })
}
