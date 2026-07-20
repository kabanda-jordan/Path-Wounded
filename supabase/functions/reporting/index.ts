import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/reporting", "").replace("/reporting", "") || "/"

  try {
    if (req.method === "GET" && path === "/carriers") return await carrierPerformance(req)
    if (req.method === "GET" && path === "/carriers/export") return await exportCarrierCSV(req)
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Reporting error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function carrierPerformance(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data: carriers } = await supabase.from("carriers").select("*").eq("status", "active")

  const results = []
  for (const carrier of carriers || []) {
    const { data: orders } = await supabase.from("orders").select("status, amount_paid, hours_on_road").eq("carrier_id", carrier.id)
    const { count: vehicleCount } = await supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("carrier_id", carrier.id)
    const { count: reviewCount } = await supabase.from("reviews").select("id", { count: "exact", head: true }).eq("carrier_id", carrier.id)

    const allOrders = orders || []
    const delivered = allOrders.filter((o: Record<string, unknown>) => o.status === "delivered")
    const totalRevenue = delivered.reduce((s: number, o: Record<string, unknown>) => s + Number(o.amount_paid || 0), 0)
    const hoursList = delivered.filter((o: Record<string, unknown>) => o.hours_on_road != null).map((o: Record<string, unknown>) => Number(o.hours_on_road))
    const avgHours = hoursList.length > 0 ? Math.round((hoursList.reduce((a: number, b: number) => a + b, 0) / hoursList.length) * 10) / 10 : 0

    results.push({
      id: carrier.id,
      name: carrier.name,
      rating: carrier.rating,
      totalOrders: allOrders.length,
      deliveredOrders: delivered.length,
      totalRevenue,
      avgHoursOnRoad: avgHours,
      vehicleCount: vehicleCount || 0,
      reviewCount: reviewCount || 0,
    })
  }

  return sendSuccess(req, results)
}

async function exportCarrierCSV(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data: carriers } = await supabase.from("carriers").select("*").eq("status", "active")

  const headers = ["Name", "Location", "Rating", "Vehicles", "Partners", "Status"]
  const rows = (carriers || []).map((c: Record<string, unknown>) => [
    c.name, c.location || "", c.rating, c.vehicle_count, c.partner_count, c.status,
  ])

  const csv = [headers.join(","), ...rows.map((r: unknown[]) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=carriers-export.csv",
      "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "*",
    },
  })
}
