import { NextRequest } from "next/server";

/**
 * Placeholder auth: returns the current user id from the request.
 * Used until Shibboleth/UofT auth is integrated.
 *
 * Dev-only: reads from header `x-user-id` or `Authorization: Bearer <userId>`.
 * Returns null if missing → callers should return 401.
 *
 * TODO: Replace with real auth (e.g. getServerSession, Shibboleth) when available.
 */
export function getCurrentUserId(request: NextRequest): string | null {
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      return token;
    }
  }

  return null;
}
