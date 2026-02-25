import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rateLimit";
import { codeRegenRateLimit } from "@/lib/redisKeys";
import { regenerateSessionCode } from "@/lib/sessionCode";
import { invalidateQRCache } from "@/lib/qrCode";

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

interface RegenerateCodeBody {
  userId: string;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * POST /api/sessions/[sessionId]/regenerate-code
 *
 * Regenerates the join code for a session.
 * Only the session creator (professor) can regenerate the code.
 * Does NOT affect already-registered students.
 *
 * Request body:
 * - userId: string (required) - The user requesting regeneration
 *
 * Returns:
 * - 200: Code regenerated successfully with new code
 * - 400: Invalid request body
 * - 403: User is not the session creator
 * - 404: Session not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Parse request body
    let body: RegenerateCodeBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Validate userId
    if (!body.userId || typeof body.userId !== "string") {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const { userId } = body;

    // TODO: Replace userId from body with authenticated user from Shibboleth

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

    // Invalidate all QR code cache entries for this session
    await invalidateQRCache(sessionId);

    return NextResponse.json({ joinCode: result.code }, { status: 200 });
  } catch (error) {
    console.error("[Sessions API] Failed to regenerate session code:", error);
    return NextResponse.json(
      { error: "An error occurred while regenerating the session code." },
      { status: 500 }
    );
  }
}
