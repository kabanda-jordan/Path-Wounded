import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/notifications", "").replace("/notifications", "") || "/"

  try {
    if (req.method === "GET" && path === "/unread-count") return await unreadCount(req)
    if (req.method === "GET" && path === "/") return await list(req)
    if (req.method === "POST" && path === "/mark-all-read") return await markAllRead(req)
    if (req.method === "POST" && path.match(/^\/[^/]+\/read$/)) return await markRead(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Notifications error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function list(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.user.userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function unreadCount(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.userId)
    .is("read_at", null)

  return sendSuccess(req, { count: count || 0 })
}

async function markRead(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.userId)
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function markAllRead(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", auth.user.userId)
    .is("read_at", null)

  return sendSuccess(req, { message: "All notifications marked as read" })
}
