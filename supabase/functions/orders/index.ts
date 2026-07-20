import { getSupabase, getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError, parsePaginationFromUrl, buildPaginationMeta } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"
import { generateOrderNumber } from "../_shared/crypto.ts"

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["in_transit", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/orders", "").replace("/orders", "") || "/"

  try {
    if (req.method === "GET" && path === "/") return await listOrders(req)
    if (req.method === "GET" && path === "/stats") return await getOrderStats(req)
    if (req.method === "GET" && path.match(/^\/[^/]+$/)) return await getOrder(req, path.split("/")[1])
    if (req.method === "POST" && path === "/") return await createOrder(req)
    if (req.method === "PATCH" && path.match(/^\/[^/]+$/)) return await updateOrder(req, path.split("/")[1])
    if (req.method === "POST" && path.match(/^\/[^/]+\/cancel$/)) return await cancelOrder(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Orders error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function listOrders(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const url = new URL(req.url)
  const { page, limit, offset } = parsePaginationFromUrl(req)
  const status = url.searchParams.get("status")
  const carrierId = url.searchParams.get("carrierId")
  const search = url.searchParams.get("search")

  const supabase = getSupabaseServiceRole()
  let query = supabase.from("orders").select("*, carriers(id, name)", { count: "exact" })

  if (status) query = query.eq("status", status)
  if (carrierId) query = query.eq("carrier_id", carrierId)
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,origin_address.ilike.%${search}%,destination_address.ilike.%${search}%`)
  }

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)

  return sendSuccess(req, data, 200, buildPaginationMeta(count || 0, page, limit))
}

async function getOrder(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("orders")
    .select("*, carriers(id, name), invoices(*)")
    .eq("id", id)
    .single()

  if (error || !data) return sendError(req, 404, "NOT_FOUND", "Order not found")
  return sendSuccess(req, data)
}

async function createOrder(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { carrierId, originAddress, destinationAddress, amountPaid } = body

  if (!originAddress || !destinationAddress) {
    return sendError(req, 400, "VALIDATION_ERROR", "originAddress and destinationAddress are required")
  }

  const supabase = getSupabaseServiceRole()
  const orderNumber = generateOrderNumber()

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      broker_id: auth.user.userId,
      carrier_id: carrierId || null,
      origin_address: originAddress,
      destination_address: destinationAddress,
      amount_paid: amountPaid || 0,
    })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 201)
}

async function updateOrder(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const supabase = getSupabaseServiceRole()

  const { data: existing } = await supabase.from("orders").select("status").eq("id", id).single()
  if (!existing) return sendError(req, 404, "NOT_FOUND", "Order not found")

  if (body.status && body.status !== existing.status) {
    const allowed = ORDER_STATUS_TRANSITIONS[existing.status] || []
    if (!allowed.includes(body.status)) {
      return sendError(req, 400, "INVALID_STATUS_TRANSITION", `Cannot transition from ${existing.status} to ${body.status}`)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (body.status) updateData.status = body.status
  if (body.carrierId !== undefined) updateData.carrier_id = body.carrierId
  if (body.originAddress) updateData.origin_address = body.originAddress
  if (body.destinationAddress) updateData.destination_address = body.destinationAddress
  if (body.amountPaid !== undefined) updateData.amount_paid = body.amountPaid
  if (body.hoursOnRoad !== undefined) updateData.hours_on_road = body.hoursOnRoad
  if (body.status === "delivered") updateData.delivered_at = new Date().toISOString()

  const { data, error } = await supabase.from("orders").update(updateData).eq("id", id).select().single()
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function cancelOrder(req: Request, id: string) {
  return updateOrder(req, id)
}

async function getOrderStats(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()

  const [total, delivered, active, pending, revenue, carriers] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["assigned", "in_transit"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("amount_paid").eq("status", "delivered"),
    supabase.from("carriers").select("id", { count: "exact", head: true }).eq("status", "active"),
  ])

  const totalRevenue = (revenue.data || []).reduce((sum: number, o: Record<string, unknown>) => sum + Number(o.amount_paid || 0), 0)

  return sendSuccess(req, {
    totalOrders: total.count || 0,
    deliveredOrders: delivered.count || 0,
    activeOrders: active.count || 0,
    pendingOrders: pending.count || 0,
    totalRevenue,
    activeCarriers: carriers.count || 0,
  })
}
