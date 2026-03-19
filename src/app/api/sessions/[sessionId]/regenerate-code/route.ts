import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rateLimit";
import { codeRegenRateLimit } from "@/lib/redisKeys";
import { regenerateSessionCode } from "@/lib/sessionCode";
import { getCurrentUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CODE_REGEN_RATE_LIMIT_COUNT = 5;
const CODE_REGEN_RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/[sessionId]/regenerate-code
 *
 * Regenerates the join code for a session.
 * Only the session creator (professor) can regenerate the code.
 *
 * Returns:
 * - 200: Code regenerated successfully with new code
 * - 401: Not authenticated
 * - 403: User is not the session creator
 * - 404: Session not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { userId } = user;

    // Check rate limit (5 regenerations per hour)
    const isRateLimited = await checkRateLimit(
      codeRegenRateLimit(userId),
      CODE_REGEN_RATE_LIMIT_COUNT,
      CODE_REGEN_RATE_LIMIT_WINDOW_SECONDS
    );
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can regenerate codes up to 5 times per hour." },
        { status: 429 }
      );
    }

    // Regenerate the session code
    const result = await regenerateSessionCode(sessionId, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    return NextResponse.json({ joinCode: result.code }, { status: 200 });
  } catch (error) {
    console.error("[Sessions API] Failed to regenerate session code:", error);
    return NextResponse.json(
      { error: "An error occurred while regenerating the session code." },
      { status: 500 }
    );
  }
}
