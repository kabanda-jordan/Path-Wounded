import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate } from "../_shared/middleware.ts"
import { sendSuccess, sendError, parsePaginationFromUrl, buildPaginationMeta } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/invoices", "").replace("/invoices", "") || "/"

  try {
    if (req.method === "GET" && path === "/") return await listInvoices(req)
    if (req.method === "POST" && path === "/detect-overdue") return await detectOverdue(req)
    if (req.method === "GET" && path.match(/^\/[^/]+$/)) return await getInvoice(req, path.split("/")[1])
    if (req.method === "POST" && path === "/") return await createInvoice(req)
    if (req.method === "POST" && path.match(/^\/[^/]+\/mark-paid$/)) return await markPaid(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Invoices error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function listInvoices(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const url = new URL(req.url)
  const { page, limit, offset } = parsePaginationFromUrl(req)
  const status = url.searchParams.get("status")

  const supabase = getSupabaseServiceRole()
  let query = supabase.from("invoices").select("*, orders(id, order_number), carriers(id, name)", { count: "exact" })
  if (status) query = query.eq("status", status)

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 200, buildPaginationMeta(count || 0, page, limit))
}

async function getInvoice(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("invoices").select("*, orders(id, order_number), carriers(id, name)").eq("id", id).single()
  if (error || !data) return sendError(req, 404, "NOT_FOUND", "Invoice not found")
  return sendSuccess(req, data)
}

async function createInvoice(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { orderId, carrierId, amount, dueDate } = body
  if (!orderId || !carrierId || !amount || !dueDate) {
    return sendError(req, 400, "VALIDATION_ERROR", "orderId, carrierId, amount, and dueDate are required")
  }

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("invoices")
    .insert({ order_id: orderId, carrier_id: carrierId, amount, due_date: dueDate })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 201)
}

async function markPaid(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function detectOverdue(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("status", "unpaid")
    .lt("due_date", new Date().toISOString())
    .select()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, { updatedCount: (data || []).length })
}
