import crypto from 'crypto'

export interface JwtPayload {
  userId: string
  email: string
  role: string
  purpose?: string
  otpExp?: number
  iat: number
  exp: number
  [key: string]: unknown
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const secret = process.env.JWT_ACCESS_SECRET || ''
    if (!secret) return null

    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(`${headerB64}.${payloadB64}`)
    const expectedSig = hmac.digest('base64url')

    if (signatureB64 !== expectedSig) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload as JwtPayload
  } catch {
    return null
  }
}

export function signAccessToken(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_ACCESS_SECRET || ''
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + 15 * 60 }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
  const bodyB64 = Buffer.from(JSON.stringify(body)).toString('base64url')
  const data = `${headerB64}.${bodyB64}`

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(data)
  const signature = hmac.digest('base64url')

  return `${data}.${signature}`
}
