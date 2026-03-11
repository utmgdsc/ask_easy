import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";

import type { SessionData } from "@/lib/session";

// ---------------------------------------------------------------------------
// Routes that do NOT require authentication
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = [
  "/api/auth/session", // session bootstrap (creates the cookie)
  "/api/health", // health check
];

const PUBLIC_PREFIXES = [
  "/_next/", // Next.js static assets
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for a valid iron-session cookie
  const cookieValue = request.cookies.get("ask_easy_session")?.value;
  if (cookieValue) {
    try {
      const sessionSecret = process.env.SESSION_SECRET;
      if (!sessionSecret) {
        // Misconfiguration — let the request through so the app can surface the error
        return NextResponse.next();
      }

      const session = await unsealData<SessionData>(cookieValue, {
        password: sessionSecret,
      });

      if (session?.userId) {
        return NextResponse.next();
      }
    } catch {
      // Tampered or expired cookie — fall through to redirect
    }
  }

  // No valid session → bootstrap one via /api/auth/session
  // The route reads the utorid header (prod) or DEV_UTORID env var (dev),
  // creates the session cookie, and redirects back here.
  const loginUrl = new URL("/api/auth/session", request.url);
  loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on all routes except Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
