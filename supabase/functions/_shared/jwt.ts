export interface AuthPayload {
  userId: string
  email: string
  role: string
}

export async function verifyAccessToken(token: string): Promise<AuthPayload | null> {
  try {
    const payload = await verifyJwt(token, Deno.env.get("JWT_ACCESS_SECRET") || "")
    if (!payload) return null
    return {
      userId: payload.userId || payload.sub || "",
      email: payload.email || "",
      role: payload.role || "viewer",
    }
  } catch {
    return null
  }
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [header, payload, signature] = parts

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
    encoder.encode(`${header}.${payload}`)
  )

  if (!valid) return null

  const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))

  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return decoded
}

export function signAccessToken(payload: Record<string, unknown>): string {
  const secret = Deno.env.get("JWT_ACCESS_SECRET") || ""
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + 15 * 60 }

  return createJwt(header, body, secret)
}

export function signRefreshToken(payload: Record<string, unknown>): string {
  const secret = Deno.env.get("JWT_REFRESH_SECRET") || ""
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + 30 * 24 * 60 * 60 }

  return createJwt(header, body, secret)
}

function createJwt(header: Record<string, string>, body: Record<string, unknown>, secret: string): string {
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const bodyB64 = btoa(JSON.stringify(body)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const data = `${headerB64}.${bodyB64}`

  const key = crypto.subtle.importKeySync(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = crypto.subtle.signSync("HMAC", key, encoder.encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return `${data}.${sigB64}`
}
