import { getSupabase, getSupabaseServiceRole } from "../_shared/supabase.ts"
import { hashToken, generateToken } from "../_shared/crypto.ts"
import { authenticate, getOrigin } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"
import { signAccessToken } from "../_shared/jwt.ts"
import { generateOtpCode, sendOtpEmail } from "../_shared/email.ts"

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/auth", "").replace("/auth", "") || "/"

  try {
    if (req.method === "POST" && path === "/signup") return await signup(req)
    if (req.method === "POST" && path === "/login") return await login(req)
    if (req.method === "POST" && path === "/verify-otp") return await verifyOtp(req)
    if (req.method === "POST" && path === "/resend-otp") return await resendOtp(req)
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

  // Generate OTP for 2FA
  const otpCode = generateOtpCode()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

  // Invalidate any existing OTPs for this user
  await supabase
    .from("otp_codes")
    .update({ verified: true })
    .eq("user_id", user.id)
    .eq("verified", false)
    .eq("purpose", "login")

  // Store new OTP
  const { error: otpError } = await supabase.from("otp_codes").insert({
    user_id: user.id,
    code: otpCode,
    purpose: "login",
    expires_at: expiresAt,
  })

  if (otpError) {
    console.error("OTP store error:", otpError)
    return sendError(req, 500, "INTERNAL_ERROR", "Failed to generate verification code")
  }

  // Send OTP email (non-blocking - don't await)
  sendOtpEmail(user.email, otpCode, user.full_name).catch((err) =>
    console.error("OTP email failed:", err)
  )

  // Generate a short-lived pending token (not the real access token)
  const pendingToken = await signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    purpose: "otp_pending",
    otpExp: Math.floor(Date.now() / 1000) + 5 * 60,
  })

  await supabase.from("audit_logs").insert({ user_id: user.id, action: "OTP_SENT", ip_address: ip, metadata: { email } })

  return sendSuccess(req, {
    pendingToken,
    requiresOtp: true,
    email: user.email,
    fullName: user.full_name,
    message: "Verification code sent to your email",
  })
}

async function verifyOtp(req: Request) {
  const body = await req.json()
  const { pendingToken, code } = body
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"

  if (!pendingToken || !code) {
    return sendError(req, 400, "VALIDATION_ERROR", "pendingToken and code are required")
  }

  if (!/^\d{8}$/.test(code)) {
    return sendError(req, 400, "VALIDATION_ERROR", "Code must be exactly 8 digits")
  }

  // Verify the pending token
  const { verifyAccessToken } = await import("../_shared/jwt.ts")
  const payload = await verifyAccessToken(pendingToken)
  if (!payload || (payload as Record<string, unknown>).purpose !== "otp_pending") {
    return sendError(req, 401, "INVALID_TOKEN", "Invalid or expired verification session")
  }

  // Check if the OTP has expired (token-level check)
  const otpExp = (payload as Record<string, unknown>).otpExp as number
  if (!otpExp || otpExp < Math.floor(Date.now() / 1000)) {
    return sendError(req, 401, "OTP_EXPIRED", "Verification session has expired. Please login again.")
  }

  const supabase = getSupabaseServiceRole()

  // Find the stored OTP
  const { data: otpRecord } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("user_id", payload.userId)
    .eq("purpose", "login")
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!otpRecord) {
    return sendError(req, 401, "OTP_NOT_FOUND", "No pending verification found. Please login again.")
  }

  // Check expiry
  if (new Date(otpRecord.expires_at) < new Date()) {
    return sendError(req, 401, "OTP_EXPIRED", "Verification code has expired. Please login again.")
  }

  // Check attempts
  if (otpRecord.attempts >= 5) {
    await supabase.from("otp_codes").update({ verified: true }).eq("id", otpRecord.id)
    return sendError(req, 429, "OTP_MAX_ATTEMPTS", "Too many failed attempts. Please login again.")
  }

  // Increment attempts
  await supabase.from("otp_codes").update({ attempts: otpRecord.attempts + 1 }).eq("id", otpRecord.id)

  // Verify code
  if (otpRecord.code !== code) {
    return sendError(req, 401, "OTP_INVALID", `Invalid verification code. ${5 - otpRecord.attempts - 1} attempts remaining.`)
  }

  // Mark OTP as verified
  await supabase.from("otp_codes").update({ verified: true }).eq("id", otpRecord.id)

  // Get full user data
  const { data: user } = await supabase.from("users").select("*").eq("id", payload.userId).single()
  if (!user) {
    return sendError(req, 404, "USER_NOT_FOUND", "User not found")
  }

  // Generate real access token
  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role })

  // Generate refresh token
  const refreshTokenValue = generateToken()
  const tokenHash = await hashToken(refreshTokenValue)
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await supabase.from("refresh_tokens").insert({ user_id: user.id, token_hash: tokenHash, expires_at: refreshExpiresAt })
  await supabase.from("audit_logs").insert({ user_id: user.id, action: "LOGIN_SUCCESS", ip_address: ip, metadata: { method: "otp_verified" } })

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

async function resendOtp(req: Request) {
  const body = await req.json()
  const { pendingToken } = body

  if (!pendingToken) {
    return sendError(req, 400, "VALIDATION_ERROR", "pendingToken is required")
  }

  const { verifyAccessToken } = await import("../_shared/jwt.ts")
  const payload = await verifyAccessToken(pendingToken)
  if (!payload || (payload as Record<string, unknown>).purpose !== "otp_pending") {
    return sendError(req, 401, "INVALID_TOKEN", "Invalid or expired verification session")
  }

  const otpExp = (payload as Record<string, unknown>).otpExp as number
  if (!otpExp || otpExp < Math.floor(Date.now() / 1000)) {
    return sendError(req, 401, "OTP_EXPIRED", "Verification session has expired. Please login again.")
  }

  const supabase = getSupabaseServiceRole()

  // Invalidate existing OTPs
  await supabase
    .from("otp_codes")
    .update({ verified: true })
    .eq("user_id", payload.userId)
    .eq("verified", false)
    .eq("purpose", "login")

  // Get user info
  const { data: user } = await supabase.from("users").select("email, full_name").eq("id", payload.userId).single()
  if (!user) {
    return sendError(req, 404, "USER_NOT_FOUND", "User not found")
  }

  // Generate new OTP
  const otpCode = generateOtpCode()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase.from("otp_codes").insert({
    user_id: payload.userId,
    code: otpCode,
    purpose: "login",
    expires_at: expiresAt,
  })

  // Send email (non-blocking)
  sendOtpEmail(user.email, otpCode, user.full_name).catch((err) =>
    console.error("OTP resend email failed:", err)
  )

  return sendSuccess(req, {
    message: emailSent ? "New verification code sent to your email" : "Failed to send email. Please try again.",
    email: user.email,
  })
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
  const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role })

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
