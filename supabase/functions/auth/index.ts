import { getSupabase, getSupabaseServiceRole } from "../_shared/supabase.ts"
import { hashToken, generateToken } from "../_shared/crypto.ts"
import { authenticate, getOrigin } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"
import { signAccessToken } from "../_shared/jwt.ts"

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/auth", "").replace("/auth", "") || "/"

  try {
    if (req.method === "POST" && path === "/signup") return await signup(req)
    if (req.method === "POST" && path === "/login") return await login(req)
    if (req.method === "POST" && path === "/refresh") return await refresh(req)
    if (req.method === "POST" && path === "/logout") return await logout(req)
    if (req.method === "GET" && path === "/me") return await me(req)
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Auth error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function signup(req: Request) {
  const body = await req.json()
  const { email, password, fullName, companyName, role } = body

  if (!email || !password || !fullName) {
    return sendError(req, 400, "VALIDATION_ERROR", "email, password, and fullName are required")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(req, 400, "VALIDATION_ERROR", "Invalid email format")
  }
  if (!PASSWORD_REGEX.test(password)) {
    return sendError(req, 400, "VALIDATION_ERROR", "Password must be at least 8 characters with uppercase, lowercase, digit, and special character")
  }

  const supabase = getSupabaseServiceRole()

  const { data: existing } = await supabase.from("users").select("id").eq("email", email).single()
  if (existing) {
    return sendError(req, 409, "EMAIL_EXISTS", "An account with this email already exists")
  }

  const passwordHash = await bcryptHash(password)

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      company_name: companyName || null,
      role: role || "broker",
    })
    .select("id, email, full_name, role")
    .single()

  if (error) {
    console.error("Signup error:", error)
    return sendError(req, 500, "INTERNAL_ERROR", "Failed to create account")
  }

  await supabase.from("audit_logs").insert({ user_id: user.id, action: "SIGNUP", metadata: { email } })

  return sendSuccess(req, { user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } }, 201)
}

async function login(req: Request) {
  const body = await req.json()
  const { email, password } = body
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"

  if (!email || !password) {
    return sendError(req, 400, "VALIDATION_ERROR", "email and password are required")
  }

  const supabase = getSupabaseServiceRole()

  const { data: user } = await supabase.from("users").select("*").eq("email", email).single()

  if (!user) {
    await supabase.from("audit_logs").insert({ action: "LOGIN_FAILED", metadata: { email }, ip_address: ip })
    return sendError(req, 401, "INVALID_CREDENTIALS", "Invalid email or password")
  }

  if (user.status === "suspended") {
    return sendError(req, 403, "ACCOUNT_SUSPENDED", "Your account has been suspended")
  }

  const valid = await bcryptCompare(password, user.password_hash)
  if (!valid) {
    await supabase.from("audit_logs").insert({ user_id: user.id, action: "LOGIN_FAILED", metadata: { email }, ip_address: ip })
    return sendError(req, 401, "INVALID_CREDENTIALS", "Invalid email or password")
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role })
  const refreshTokenValue = generateToken()
  const tokenHash = await hashToken(refreshTokenValue)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await supabase.from("refresh_tokens").insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt })
  await supabase.from("audit_logs").insert({ user_id: user.id, action: "LOGIN_SUCCESS", ip_address: ip })

  const headers = getOrigin(req)
  headers["Set-Cookie"] = `refreshToken=${refreshTokenValue}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${30 * 24 * 60 * 60}`

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, avatarUrl: user.avatar_url },
      },
    }),
    { status: 200, headers }
  )
}

async function refresh(req: Request) {
  const cookieHeader = req.headers.get("Cookie") || ""
  const refreshTokenValue = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("refreshToken="))
    ?.split("=")[1]

  if (!refreshTokenValue) {
    return sendError(req, 401, "NO_REFRESH_TOKEN", "No refresh token provided")
  }

  const supabase = getSupabaseServiceRole()
  const tokenHash = await hashToken(refreshTokenValue)

  const { data: stored } = await supabase
    .from("refresh_tokens")
    .select("*, users!inner(*)")
    .eq("token_hash", tokenHash)
    .single()

  if (!stored || stored.revoked) {
    if (stored?.revoked) {
      await supabase.from("refresh_tokens").update({ revoked: true }).eq("user_id", stored.user_id).eq("revoked", false)
    }
    return sendError(req, 401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")
  }

  if (new Date(stored.expires_at) < new Date()) {
    return sendError(req, 401, "INVALID_REFRESH_TOKEN", "Refresh token has expired")
  }

  await supabase.from("refresh_tokens").update({ revoked: true }).eq("id", stored.id)

  const newRefreshValue = generateToken()
  const newHash = await hashToken(newRefreshValue)
  await supabase.from("refresh_tokens").insert({ user_id: stored.user_id, token_hash: newHash, expires_at: stored.expires_at })

  const user = stored.users
  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role })

  const headers = getOrigin(req)
  headers["Set-Cookie"] = `refreshToken=${newRefreshValue}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${30 * 24 * 60 * 60}`

  return new Response(JSON.stringify({ success: true, data: { accessToken } }), { status: 200, headers })
}

async function logout(req: Request) {
  const cookieHeader = req.headers.get("Cookie") || ""
  const refreshTokenValue = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("refreshToken="))
    ?.split("=")[1]

  if (refreshTokenValue) {
    const supabase = getSupabaseServiceRole()
    const tokenHash = await hashToken(refreshTokenValue)
    await supabase.from("refresh_tokens").update({ revoked: true }).eq("token_hash", tokenHash)
  }

  const headers = getOrigin(req)
  headers["Set-Cookie"] = "refreshToken=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0"

  return new Response(JSON.stringify({ success: true, data: { message: "Logged out successfully" } }), { status: 200, headers })
}

async function me(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, company_name, role, avatar_url, email_verified, status, created_at")
    .eq("id", auth.user.userId)
    .single()

  if (error || !user) {
    return sendError(req, 404, "USER_NOT_FOUND", "User not found")
  }

  return sendSuccess(req, {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    companyName: user.company_name,
    role: user.role,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    status: user.status,
    createdAt: user.created_at,
  })
}

async function bcryptHash(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"])
  const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 12000, hash: "SHA-256" }, keyMaterial, 256)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  return `$pbkdf2-sha256$12000$${saltHex}$${hashHex}`
}

async function bcryptCompare(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$")) {
    return await bcryptCompareLegacy(password, storedHash)
  }

  if (!storedHash.startsWith("$pbkdf2-sha256$")) return false

  const parts = storedHash.split("$")
  const saltHex = parts[3]
  const expectedHash = parts[4]

  const encoder = new TextEncoder()
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h: string) => parseInt(h, 16)))
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"])
  const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 12000, hash: "SHA-256" }, keyMaterial, 256)
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex === expectedHash
}

async function bcryptCompareLegacy(password: string, hash: string): Promise<boolean> {
  const supabase = getSupabaseServiceRole()
  const { data } = await supabase.rpc("verify_password", { password, hash })
  return data === true
}
