import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/messages", "").replace("/messages", "") || "/"

  try {
    if (req.method === "GET" && path === "/unread-count") return await unreadCount(req)
    if (req.method === "GET" && path === "/threads") return await getThreads(req)
    if (req.method === "GET" && path.match(/^\/threads\/[^/]+$/)) return await getThread(req, path.split("/")[2])
    if (req.method === "POST" && path.match(/^\/threads\/[^/]+\/read$/)) return await markRead(req, path.split("/")[2])
    if (req.method === "POST" && path === "/") return await send(req)
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Messages error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function send(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { recipientId, body: messageBody, threadId } = body
  if (!recipientId || !messageBody) return sendError(req, 400, "VALIDATION_ERROR", "recipientId and body are required")

  const supabase = getSupabaseServiceRole()
  const finalThreadId = threadId || crypto.randomUUID()

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: auth.user.userId, recipient_id: recipientId, thread_id: finalThreadId, body: messageBody })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 201)
}

async function getThreads(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data } = await supabase
    .from("messages")
    .select("*, sender:users!sender_id(id, full_name), recipient:users!recipient_id(id, full_name)")
    .or(`sender_id.eq.${auth.user.userId},recipient_id.eq.${auth.user.userId}`)
    .order("created_at", { ascending: false })

  const threadMap = new Map<string, unknown>()
  for (const msg of data || []) {
    if (!threadMap.has(msg.thread_id)) {
      threadMap.set(msg.thread_id, msg)
    }
  }

  return sendSuccess(req, Array.from(threadMap.values()))
}

async function getThread(req: Request, threadId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users!sender_id(id, full_name), recipient:users!recipient_id(id, full_name)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function markRead(req: Request, threadId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("recipient_id", auth.user.userId)
    .is("read_at", null)

  return sendSuccess(req, { message: "Messages marked as read" })
}

async function unreadCount(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", auth.user.userId)
    .is("read_at", null)

  return sendSuccess(req, { count: count || 0 })
}
