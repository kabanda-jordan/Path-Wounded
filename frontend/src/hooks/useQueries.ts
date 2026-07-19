import { useQuery } from '@tanstack/react-query'
import { ordersApi, analyticsApi } from '../api/orders'
import { carriersApi } from '../api/carriers'
import { invoicesApi } from '../api/invoices'
import { messagesApi, notificationsApi, automationsApi } from '../api/misc'

export function useOverview() {
  return useQuery({ queryKey: ['analytics', 'overview'], queryFn: () => analyticsApi.overview() })
}

export function useRevenue(range: string = '30d') {
  return useQuery({ queryKey: ['analytics', 'revenue', range], queryFn: () => analyticsApi.revenue(range) })
}

export function useVehicleBreakdown() {
  return useQuery({ queryKey: ['analytics', 'vehicle-breakdown'], queryFn: () => analyticsApi.vehicleBreakdown() })
}

export function useOrderStatusBreakdown() {
  return useQuery({ queryKey: ['analytics', 'order-status'], queryFn: () => analyticsApi.orderStatusBreakdown() })
}

export function useTopCarriers(limit = 10) {
  return useQuery({ queryKey: ['carriers', 'top', limit], queryFn: () => carriersApi.top(limit) })
}

export function useOrders(params?: Record<string, string>) {
  return useQuery({ queryKey: ['orders', params], queryFn: () => ordersApi.list(params) })
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['orders', id], queryFn: () => ordersApi.get(id), enabled: !!id })
}

export function useCarriers(params?: Record<string, string>) {
  return useQuery({ queryKey: ['carriers', params], queryFn: () => carriersApi.list(params) })
}

export function useCarrier(id: string) {
  return useQuery({ queryKey: ['carriers', id], queryFn: () => carriersApi.get(id), enabled: !!id })
}

export function useInvoices(params?: Record<string, string>) {
  return useQuery({ queryKey: ['invoices', params], queryFn: () => invoicesApi.list(params) })
}

export function useMessages() {
  return useQuery({ queryKey: ['messages', 'threads'], queryFn: () => messagesApi.getThreads() })
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list(), refetchInterval: 30_000 })
}

export function useUnreadNotificationCount() {
  return useQuery({ queryKey: ['notifications', 'unread'], queryFn: () => notificationsApi.unreadCount(), refetchInterval: 15_000 })
}

export function useAutomations() {
  return useQuery({ queryKey: ['automations'], queryFn: () => automationsApi.list() })
}
