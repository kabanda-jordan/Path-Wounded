import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/partners", "").replace("/partners", "") || "/"

  try {
    if (req.method === "GET" && path.match(/^\/carrier\/[^/]+$/)) return await listPartners(req, path.split("/")[2])
    if (req.method === "POST" && path.match(/^\/carrier\/[^/]+$/)) return await createPartner(req, path.split("/")[2])
    if (req.method === "DELETE" && path.match(/^\/[^/]+$/)) return await deletePartner(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Partners error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function listPartners(req: Request, carrierId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("partners").select("*").eq("carrier_id", carrierId)
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function createPartner(req: Request, carrierId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { name, type } = body
  if (!name || !type) return sendError(req, 400, "VALIDATION_ERROR", "name and type are required")

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("partners")
    .insert({ carrier_id: carrierId, name, type })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)

  const { data: carrier } = await supabase.from("carriers").select("partner_count").eq("id", carrierId).single()
  if (carrier) {
    await supabase.from("carriers").update({ partner_count: carrier.partner_count + 1 }).eq("id", carrierId)
  }

  return sendSuccess(req, data, 201)
}

async function deletePartner(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data: partner } = await supabase.from("partners").select("carrier_id").eq("id", id).single()
  if (!partner) return sendError(req, 404, "NOT_FOUND", "Partner not found")

  await supabase.from("partners").delete().eq("id", id)

  const { data: carrier } = await supabase.from("carriers").select("partner_count").eq("id", partner.carrier_id).single()
  if (carrier && carrier.partner_count > 0) {
    await supabase.from("carriers").update({ partner_count: carrier.partner_count - 1 }).eq("id", partner.carrier_id)
  }

  return sendSuccess(req, { message: "Partner deleted" })
}
