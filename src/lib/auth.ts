import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

import { SESSION_OPTIONS, type SessionData } from "@/lib/session";

// ---------------------------------------------------------------------------
// Authenticated user shape returned to route handlers
// ---------------------------------------------------------------------------

export interface AuthUser {
  userId: string;
  utorid: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// getCurrentUser
//
// Reads the iron-session cookie (set by /api/auth/session after Shibboleth
// authentication) and returns the user, or null if the session is missing or
// invalid.
//
// Usage in App Router route handlers:
//
//   const user = await getCurrentUser();
//   if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);

  if (!session.userId) {
    return null;
  }

  return {
    userId: session.userId,
    utorid: session.utorid,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}

// ---------------------------------------------------------------------------
// getCurrentUserId
//
// Convenience wrapper — returns only the userId string.
// Kept for compatibility with existing route handlers.
// ---------------------------------------------------------------------------

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.userId ?? null;
}
