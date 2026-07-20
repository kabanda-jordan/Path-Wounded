import { verifyAccessToken, type AuthPayload } from "./jwt.ts"
import { corsHeadersWithOrigin } from "./cors.ts"

export function getOrigin(req: Request): Record<string, string> {
  return corsHeadersWithOrigin(req.headers.get("origin"))
}

export async function authenticate(req: Request): Promise<{ user: AuthPayload } | { error: Response }> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" } }),
        { status: 401, headers: { ...getOrigin(req), "Content-Type": "application/json" } }
      ),
    }
  }

  const token = authHeader.split(" ")[1]
  const user = await verifyAccessToken(token)
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: { code: "TOKEN_EXPIRED", message: "Access token is invalid or has expired" } }),
        { status: 401, headers: { ...getOrigin(req), "Content-Type": "application/json" } }
      ),
    }
  }

  return { user }
}

export function requireRole(user: AuthPayload, roles: string[]): Response | null {
  if (!roles.includes(user.role)) {
    return new Response(
      JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" } }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }
  return null
}
