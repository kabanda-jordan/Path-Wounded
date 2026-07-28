export interface Profile {
  id: string
  email: string
  fullName: string
  companyName: string | null
  role: 'admin' | 'broker' | 'carrier' | 'dispatcher' | 'viewer'
  avatarUrl: string | null
  emailVerified: boolean
  status: 'active' | 'suspended'
  createdAt: string
}

export interface Carrier {
  id: string
  name: string
  logoUrl?: string | null
  location?: string | null
  rating: number
  vehicleCount: number
  partnerCount: number
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  vehicles?: Vehicle[]
  partners?: Partner[]
  reviews?: Review[]
  orderCount?: number
  _count?: { vehicles: number; partners: number; orders: number }
}

export interface Vehicle {
  id: string
  carrierId: string
  type: 'truck' | 'cargo_van' | 'trailer' | 'cargo_plane' | 'other'
  identifier: string
  status: 'active' | 'inactive' | 'maintenance'
}

export interface Order {
  id: string
  orderNumber: string
  brokerId: string
  carrierId?: string | null
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled'
  originAddress: string
  destinationAddress: string
  amountPaid: number
  hoursOnRoad?: number | null
  createdAt: string
  updatedAt: string
  deliveredAt?: string | null
  carrier?: { id: string; name: string; rating: number } | null
  invoices?: Invoice[]
}

export interface Invoice {
  id: string
  orderId: string
  carrierId: string
  amount: number
  status: 'unpaid' | 'paid' | 'overdue'
  dueDate: string
  paidAt?: string | null
  createdAt: string
  order?: { id: string; orderNumber: string }
  carrier?: { id: string; name: string }
}

export interface Partner {
  id: string
  carrierId: string
  name: string
  type: string
}

export interface Review {
  id: string
  carrierId: string
  authorId: string
  orderId?: string | null
  rating: number
  comment?: string | null
  createdAt: string
  author?: { id: string; fullName: string; avatarUrl?: string | null }
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  threadId: string
  body: string
  readAt?: string | null
  createdAt: string
  sender?: { id: string; fullName: string; avatarUrl?: string | null }
  recipient?: { id: string; fullName: string; avatarUrl?: string | null }
}

export interface Automation {
  id: string
  userId: string
  name: string
  triggerType: string
  actionType: string
  config: Record<string, unknown>
  isActive: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  payload: Record<string, unknown>
  readAt?: string | null
  createdAt: string
}

export interface OverviewStats {
  totalOrders: number
  deliveredOrders: number
  activeOrders: number
  pendingOrders: number
  totalRevenue: number
  avgHoursOnRoad: number
  activeCarriers: number
}

export interface RevenueData {
  date: string
  revenue: number
}

export interface VehicleBreakdownItem {
  type: string
  count: number
  percentage: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  success: boolean
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface OtpPendingResponse {
  pendingToken: string
  requiresOtp: boolean
  email: string
  fullName: string
  message: string
}
