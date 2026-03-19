import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

import { getSessionOptions, type SessionData } from "@/lib/session";

// ---------------------------------------------------------------------------
// POST /api/auth/logout
//
// Destroys the iron-session cookie so the user is effectively logged out
// of the application layer. Uses the same cookie options (path, domain,
// secure, httpOnly, sameSite) that were used to set it, ensuring the
// browser actually clears it.
//
// Note: This does NOT end the Shibboleth IdP session. The user may be
// automatically re-authenticated on their next visit if their IdP session
// is still active.
// ---------------------------------------------------------------------------

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth] Failed to destroy session:", error);
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
