import { NextRequest, NextResponse } from "next/server";

import {
  validateSessionJoinRequest,
  checkSessionJoinLookupRateLimit,
  checkSessionJoinRegisterRateLimit,
} from "@/lib/sessionJoinValidation";
import { lookupSessionByCode, joinSession } from "@/lib/sessionJoin";

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
 * Query parameters:
 *   - userId: string (required for rate limiting)
 *
 * Returns:
 *   - 200: Session found
 *   - 400: Missing userId
 *   - 404: Session not found
 *   - 429: Rate limit exceeded
 *   - 500: Server error
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Get userId from query params for rate limiting
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // TODO: Replace userId from query with authenticated user from Shibboleth

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // Check rate limit (30 lookups per minute)
    const isRateLimited = await checkSessionJoinLookupRateLimit(userId);
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
 * Request body:
 *   - userId: string (required)
 *
 * Returns:
 *   - 201: Successfully joined
 *   - 400: Invalid request body
 *   - 404: Session not found
 *   - 409: Already enrolled in course
 *   - 410: Session has ended
 *   - 429: Rate limit exceeded
 *   - 500: Server error
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Validate request body
    const validation = validateSessionJoinRequest(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { userId } = body as { userId: string };

    // TODO: Replace userId from body with authenticated user from Shibboleth

    // Check rate limit (10 registrations per minute)
    const isRateLimited = await checkSessionJoinRegisterRateLimit(userId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before joining another session." },
        { status: 429 }
      );
    }

    // Join session
    const result = await joinSession(code, userId);

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
