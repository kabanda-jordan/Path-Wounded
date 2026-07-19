export const ROLES = {
  admin: ['admin'] as const,
  broker: ['admin', 'broker'] as const,
  carrier: ['admin', 'carrier'] as const,
  dispatcher: ['admin', 'dispatcher'] as const,
  viewer: ['admin', 'viewer'] as const,
  all: ['admin', 'broker', 'carrier', 'dispatcher', 'viewer'] as const,
} as const

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 100 },
  api: { windowMs: 15 * 60 * 1000, max: 1000 },
}

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
