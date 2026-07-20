import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/analytics", "").replace("/analytics", "") || "/"

  try {
    if (req.method === "GET" && path === "/overview") return await getOverview(req)
    if (req.method === "GET" && path === "/revenue") return await getRevenueOverTime(req)
    if (req.method === "GET" && path === "/vehicle-breakdown") return await getVehicleBreakdown(req)
    if (req.method === "GET" && path === "/order-status-breakdown") return await getOrderStatusBreakdown(req)
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Analytics error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function getOverview(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()

  const [totalOrders, deliveredOrders, activeOrders, pendingOrders, revenue, carriers] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["assigned", "in_transit"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("amount_paid, hours_on_road").eq("status", "delivered"),
    supabase.from("carriers").select("id", { count: "exact", head: true }).eq("status", "active"),
  ])

  const totalRevenue = (revenue.data || []).reduce((s: number, o: Record<string, unknown>) => s + Number(o.amount_paid || 0), 0)
  const hoursList = (revenue.data || []).filter((o: Record<string, unknown>) => o.hours_on_road != null).map((o: Record<string, unknown>) => Number(o.hours_on_road))
  const avgHours = hoursList.length > 0 ? Math.round((hoursList.reduce((a: number, b: number) => a + b, 0) / hoursList.length) * 10) / 10 : 0

  return sendSuccess(req, {
    totalOrders: totalOrders.count || 0,
    deliveredOrders: deliveredOrders.count || 0,
    activeOrders: activeOrders.count || 0,
    pendingOrders: pendingOrders.count || 0,
    totalRevenue,
    avgHoursOnRoad: avgHours,
    activeCarriers: carriers.count || 0,
  })
}

async function getRevenueOverTime(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const url = new URL(req.url)
  const range = url.searchParams.get("range") || "30d"
  const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "12m" ? 365 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = getSupabaseServiceRole()
  const { data } = await supabase.from("invoices").select("amount, created_at").eq("status", "paid").gte("created_at", since)

  const buckets: Record<string, number> = {}
  for (const inv of data || []) {
    const date = new Date(inv.created_at).toISOString().split("T")[0]
    buckets[date] = (buckets[date] || 0) + Number(inv.amount)
  }

  const result = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }))

  return sendSuccess(req, result)
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

  return sendSuccess(req, Object.entries(grouped).map(([type, count]) => ({
    type, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  })))
}

async function getOrderStatusBreakdown(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data } = await supabase.from("orders").select("status")
  const total = (data || []).length
  const grouped = (data || []).reduce((acc: Record<string, number>, o: Record<string, unknown>) => {
    acc[o.status as string] = (acc[o.status as string] || 0) + 1
    return acc
  }, {})

  return sendSuccess(req, Object.entries(grouped).map(([status, count]) => ({
    status, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  })))
}
