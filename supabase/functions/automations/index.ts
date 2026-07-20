import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/automations", "").replace("/automations", "") || "/"

  try {
    if (req.method === "GET" && path === "/") return await list(req)
    if (req.method === "GET" && path.match(/^\/[^/]+$/)) return await get(req, path.split("/")[1])
    if (req.method === "POST" && path === "/") return await create(req)
    if (req.method === "PATCH" && path.match(/^\/[^/]+$/)) return await update(req, path.split("/")[1])
    if (req.method === "DELETE" && path.match(/^\/[^/]+$/)) return await remove(req, path.split("/")[1])
    if (req.method === "POST" && path.match(/^\/[^/]+\/toggle$/)) return await toggle(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Automations error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function list(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("automations").select("*").eq("user_id", auth.user.userId).order("created_at", { ascending: false })
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function get(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("automations").select("*").eq("id", id).single()
  if (error || !data) return sendError(req, 404, "NOT_FOUND", "Automation not found")
  return sendSuccess(req, data)
}

async function create(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { name, triggerType, actionType, config } = body
  if (!name || !triggerType || !actionType) return sendError(req, 400, "VALIDATION_ERROR", "name, triggerType, and actionType are required")

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("automations")
    .insert({ user_id: auth.user.userId, name, trigger_type: triggerType, action_type: actionType, config: config || {} })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 201)
}

async function update(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const updateData: Record<string, unknown> = {}
  if (body.name) updateData.name = body.name
  if (body.triggerType) updateData.trigger_type = body.triggerType
  if (body.actionType) updateData.action_type = body.actionType
  if (body.config) updateData.config = body.config

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("automations").update(updateData).eq("id", id).select().single()
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function remove(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  await supabase.from("automations").delete().eq("id", id)
  return sendSuccess(req, { message: "Automation deleted" })
}

async function toggle(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data: existing } = await supabase.from("automations").select("is_active").eq("id", id).single()
  if (!existing) return sendError(req, 404, "NOT_FOUND", "Automation not found")

  const { data, error } = await supabase.from("automations").update({ is_active: !existing.is_active }).eq("id", id).select().single()
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}
