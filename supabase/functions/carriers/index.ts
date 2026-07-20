import { getSupabaseServiceRole } from "../_shared/supabase.ts"
import { authenticate, requireRole } from "../_shared/middleware.ts"
import { sendSuccess, sendError, parsePaginationFromUrl, buildPaginationMeta } from "../_shared/response.ts"
import { handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const url = new URL(req.url)
  const path = url.pathname.replace("/functions/v1/carriers", "").replace("/carriers", "") || "/"

  try {
    if (req.method === "GET" && path === "/") return await listCarriers(req)
    if (req.method === "GET" && path === "/top") return await getTopCarriers(req)
    if (req.method === "GET" && path.match(/^\/[^/]+$/)) return await getCarrier(req, path.split("/")[1])
    if (req.method === "POST" && path === "/") return await createCarrier(req)
    if (req.method === "PATCH" && path.match(/^\/[^/]+$/)) return await updateCarrier(req, path.split("/")[1])
    if (req.method === "POST" && path.match(/^\/[^/]+\/reviews$/)) return await createReview(req, path.split("/")[1])
    if (req.method === "GET" && path.match(/^\/[^/]+\/reviews$/)) return await getReviews(req, path.split("/")[1])
    return sendError(req, 404, "NOT_FOUND", "Endpoint not found")
  } catch (err) {
    console.error("Carriers error:", err)
    return sendError(req, 500, "INTERNAL_ERROR", "Internal server error")
  }
})

async function listCarriers(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const url = new URL(req.url)
  const { page, limit, offset } = parsePaginationFromUrl(req)
  const search = url.searchParams.get("search")

  const supabase = getSupabaseServiceRole()
  let query = supabase.from("carriers").select("*", { count: "exact" }).eq("status", "active")

  if (search) {
    query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`)
  }

  const { data, count, error } = await query.order("rating", { ascending: false }).range(offset, offset + limit - 1)
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 200, buildPaginationMeta(count || 0, page, limit))
}

async function getTopCarriers(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get("limit") || "10")

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("status", "active")
    .order("rating", { ascending: false })
    .limit(limit)

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function getCarrier(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("carriers")
    .select("*, vehicles(*), partners(*)")
    .eq("id", id)
    .single()

  if (error || !data) return sendError(req, 404, "NOT_FOUND", "Carrier not found")

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users(id, full_name)")
    .eq("carrier_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  return sendSuccess(req, { ...data, reviews: reviews || [] })
}

async function createCarrier(req: Request) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error
  const roleError = requireRole(auth.user, ["admin"])
  if (roleError) return roleError

  const body = await req.json()
  const { name, location, logoUrl } = body
  if (!name) return sendError(req, 400, "VALIDATION_ERROR", "name is required")

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from("carriers")
    .insert({ name, location: location || null, logo_url: logoUrl || null })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 201)
}

async function updateCarrier(req: Request, id: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error
  const roleError = requireRole(auth.user, ["admin"])
  if (roleError) return roleError

  const body = await req.json()
  const updateData: Record<string, unknown> = {}
  if (body.name) updateData.name = body.name
  if (body.location !== undefined) updateData.location = body.location
  if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.from("carriers").update(updateData).eq("id", id).select().single()
  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data)
}

async function createReview(req: Request, carrierId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const body = await req.json()
  const { rating, comment, orderId } = body
  if (!rating || rating < 1 || rating > 5) {
    return sendError(req, 400, "VALIDATION_ERROR", "rating must be between 1 and 5")
  }

  const supabase = getSupabaseServiceRole()

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("author_id", auth.user.userId)
    .eq("carrier_id", carrierId)
    .eq("order_id", orderId || null)
    .single()

  if (existing) return sendError(req, 409, "DUPLICATE", "You have already reviewed this carrier for this order")

  const { data, error } = await supabase
    .from("reviews")
    .insert({ carrier_id: carrierId, author_id: auth.user.userId, order_id: orderId || null, rating, comment: comment || null })
    .select()
    .single()

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)

  const { data: agg } = await supabase.from("reviews").select("rating").eq("carrier_id", carrierId)
  const avgRating = (agg || []).reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.rating), 0) / (agg?.length || 1)
  await supabase.from("carriers").update({ rating: Math.round(avgRating * 10) / 10 }).eq("id", carrierId)

  return sendSuccess(req, data, 201)
}

async function getReviews(req: Request, carrierId: string) {
  const auth = await authenticate(req)
  if ("error" in auth) return auth.error

  const { page, limit, offset } = parsePaginationFromUrl(req)
  const supabase = getSupabaseServiceRole()

  const { data, count, error } = await supabase
    .from("reviews")
    .select("*, users(id, full_name)", { count: "exact" })
    .eq("carrier_id", carrierId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return sendError(req, 500, "DATABASE_ERROR", error.message)
  return sendSuccess(req, data, 200, buildPaginationMeta(count || 0, page, limit))
}
