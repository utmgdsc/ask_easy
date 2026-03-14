import { NextRequest, NextResponse } from "next/server";

import {
  checkSessionJoinLookupRateLimit,
  checkSessionJoinRegisterRateLimit,
} from "@/lib/sessionJoinValidation";
import { lookupSessionByCode, joinSession } from "@/lib/sessionJoin";
import { getCurrentUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ code: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/sessions/join/[code]
// ---------------------------------------------------------------------------

/**
 * Looks up a session by join code (case-insensitive).
 *
 * Returns:
 *   - 200: Session found
 *   - 401: Not authenticated
 *   - 404: Session not found
 *   - 429: Rate limit exceeded
 *   - 500: Server error
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Check rate limit (30 lookups per minute)
    const isRateLimited = await checkSessionJoinLookupRateLimit(user.userId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before looking up another session." },
        { status: 429 }
      );
    }

    // Look up session by code
    const result = await lookupSessionByCode(code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    return NextResponse.json({ session: result.session });
  } catch (error) {
    console.error("[Session Join API] Failed to lookup session:", error);
    return NextResponse.json(
      { error: "An error occurred while looking up the session." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/sessions/join/[code]
// ---------------------------------------------------------------------------

/**
 * Joins a session by creating a CourseEnrollment for the session's course.
 *
 * Returns:
 *   - 201: Successfully joined
 *   - 401: Not authenticated
 *   - 404: Session not found
 *   - 409: Already enrolled in course
 *   - 410: Session has ended
 *   - 429: Rate limit exceeded
 *   - 500: Server error
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Check rate limit (10 registrations per minute)
    const isRateLimited = await checkSessionJoinRegisterRateLimit(user.userId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before joining another session." },
        { status: 429 }
      );
    }

    // Join session
    const result = await joinSession(code, user.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    return NextResponse.json(
      {
        enrollment: result.enrollment,
        session: result.session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Session Join API] Failed to join session:", error);
    return NextResponse.json(
      { error: "An error occurred while joining the session." },
      { status: 500 }
    );
  }
}
