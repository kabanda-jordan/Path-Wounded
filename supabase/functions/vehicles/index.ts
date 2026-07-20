import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate, requireRole } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/vehicles", "").replace("/vehicles", "") || "/"

  try {
    if (req.method === "GET" && path === "/breakdown") return await getVehicleBreakdown(req)
    if (req.method === "GET" && path.match(/^\/carrier\/[^/]+$/)) return await listVehicles(req, path.split("/")[2])
    if (req.method === "GET" && path.match(/^\/[^/]+$/)) return await getVehicle(req, path.split("/")[1])
    if (req.method === "POST" && path.match(/^\/carrier\/[^/]+$/)) return await createVehicle(req, path.split("/")[2])
    if (req.method === "PATCH" && path.match(/^\/[^/]+$/)) return await updateVehicle(req, path.split("/")[1])
    if (req.method === "DELETE" && path.match(/^\/[^/]+$/)) return await deleteVehicle(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Vehicles error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function listVehicles(req: Request, carrierId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("vehicles").select("*").eq("carrier_id", carrierId).order("id", { ascending: false })
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function getVehicle(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single()
  if (error || !data) return sendError(req, 404, "NOT_FOUND", "Vehicle not found")
  return sendSuccess(req, data)
}

async function createVehicle(req: Request, carrierId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error
  const roleError = requireRole(auth.user, ["admin", "carrier"])
  if (roleError) return roleError

  const body = await req.json()
  const { type, identifier, status } = body
  if (!type || !identifier) return sendError(req, 400, "VALIDATION_ERROR", "type and identifier are required")

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ carrier_id: carrierId, type, identifier, status: status || "active" })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)

  await supabase.rpc("increment_vehicle_count", { cid: carrierId }).catch(() => {
    supabase.from("carriers").select("vehicle_count").eq("id", carrierId).single().then(({ data: c }) => {
      if (c) supabase.from("carriers").update({ vehicle_count: c.vehicle_count + 1 }).eq("id", carrierId)
    })
  })

  return sendSuccess(req, data, 201)
}

async function updateVehicle(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error
  const roleError = requireRole(auth.user, ["admin", "carrier"])
  if (roleError) return roleError

  const body = await req.json()
  const updateData: Record<string, unknown> = {}
  if (body.type) updateData.type = body.type
  if (body.identifier) updateData.identifier = body.identifier
  if (body.status) updateData.status = body.status

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("vehicles").update(updateData).eq("id", id).select().single()
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function deleteVehicle(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error
  const roleError = requireRole(auth.user, ["admin", "carrier"])
  if (roleError) return roleError

  const supabase = getSupabaseServiceRole()
  const { data: vehicle } = await supabase.from("vehicles").select("carrier_id").eq("id", id).single()
  if (!vehicle) return sendError(req, 404, "NOT_FOUND", "Vehicle not found")

  await supabase.from("vehicles").delete().eq("id", id)

  const { data: carrier } = await supabase.from("carriers").select("vehicle_count").eq("id", vehicle.carrier_id).single()
  if (carrier && carrier.vehicle_count > 0) {
    await supabase.from("carriers").update({ vehicle_count: carrier.vehicle_count - 1 }).eq("id", vehicle.carrier_id)
  }

  return sendSuccess(req, { message: "Vehicle deleted" })
}

async function getVehicleBreakdown(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data } = await supabase.from("vehicles").select("type")
  const total = (data || []).length
  const grouped = (data || []).reduce((acc: Record<string, number>, v: Record<string, unknown>) => {
    acc[v.type as string] = (acc[v.type as string] || 0) + 1
    return acc
  }, {})

  const breakdown = Object.entries(grouped).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))

  return sendSuccess(req, breakdown)
}
