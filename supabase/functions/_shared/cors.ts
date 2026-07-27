const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin")
    const headers = corsHeadersWithOrigin(origin)
    return new Response("ok", { headers })
  }
  return null
}

export function corsHeadersWithOrigin(origin: string | null): Record<string, string> {
  const allowed = Deno.env.get("CORS_ORIGIN") || "*"
  const allowedOrigins = allowed.split(",").map((o) => o.trim())
  const resolvedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "*"

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": resolvedOrigin,
  }
}
