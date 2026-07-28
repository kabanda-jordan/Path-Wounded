import { randomBytes } from 'crypto'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString('hex').toUpperCase()
  return `PW-${timestamp}-${random}`
}

export function generateOtpCode(): string {
  const bytes = randomBytes(4)
  const num = bytes.readUInt32BE(0)
  return String(num % 100_000_000).padStart(8, '0')
}
