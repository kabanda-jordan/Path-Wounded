import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"
import { hashToken } from "../_shared/crypto.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/users", "").replace("/users", "") || "/"

  try {
    if (req.method === "GET" && path === "/profile") return await getProfile(req)
    if (req.method === "PATCH" && path === "/profile") return await updateProfile(req)
    if (req.method === "POST" && path === "/change-password") return await changePassword(req)
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Users error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function getProfile(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, company_name, role, avatar_url, email_verified, status, created_at")
    .eq("id", auth.user.userId)
    .single()

  if (error || !user) return sendError(req, 404, "USER_NOT_FOUND", "User not found")
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

async function updateProfile(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const updateData: Record<string, unknown> = {}
  if (body.fullName) updateData.full_name = body.fullName
  if (body.companyName !== undefined) updateData.company_name = body.companyName

  if (Object.keys(updateData).length === 0) {
    return sendError(req, 400, "VALIDATION_ERROR", "No fields to update")
  }

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("users").update(updateData).eq("id", auth.user.userId).select("id, email, full_name, company_name, role, avatar_url").single()
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    companyName: data.company_name,
    role: data.role,
    avatarUrl: data.avatar_url,
  })
}

async function changePassword(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { currentPassword, newPassword } = body
  if (!currentPassword || !newPassword) return sendError(req, 400, "VALIDATION_ERROR", "currentPassword and newPassword are required")

  const supabase = getSupabaseServiceRole()
  const { data: user } = await supabase.from("users").select("password_hash").eq("id", auth.user.userId).single()
  if (!user) return sendError(req, 404, "USER_NOT_FOUND", "User not found")

  const { data: valid } = await supabase.rpc("verify_password", { password: currentPassword, hash: user.password_hash })
  if (!valid) return sendError(req, 401, "INVALID_PASSWORD", "Current password is incorrect")

  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(newPassword), { name: "PBKDF2" }, false, ["deriveBits"])
  const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 12000, hash: "SHA-256" }, keyMaterial, 256)
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  const newHash = `$pbkdf2-sha256$12000$${saltHex}$${hashHex}`

  await supabase.from("users").update({ password_hash: newHash }).eq("id", auth.user.userId)
  await supabase.from("refresh_tokens").update({ revoked: true }).eq("user_id", auth.user.userId).eq("revoked", false)

  return sendSuccess(req, { message: "Password changed successfully" })
}
