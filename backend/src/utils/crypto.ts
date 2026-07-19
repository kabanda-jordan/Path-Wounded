import crypto from 'crypto'

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateToken(length = 48): string {
  return crypto.randomBytes(length).toString('hex')
}

export function generateOrderNumber(): string {
  const prefix = 'PW'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
