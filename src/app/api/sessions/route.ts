import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateSessionCreate, checkSessionCreateRateLimit } from "@/lib/sessionValidation";
import { createSession } from "@/lib/sessionService";

/**
 * GET /api/sessions
 *
 * Returns active sessions with course info.
 */
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        joinCode: true,
        status: true,
        course: { select: { code: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Sessions API] Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching sessions." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 *
 * Creates a new session for a course.
 * Only professors enrolled in the course can create sessions.
 *
 * Request body:
 * - courseId: string (required) - The course to create the session for
 * - title: string (required) - Session title (3-100 characters)
 * - userId: string (required) - The user creating the session
 *
 * Returns:
 * - 201: Session created successfully
 * - 400: Invalid request body or validation error
 * - 403: User is not a professor in the course
 * - 404: Course not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Validate request body
    const validation = validateSessionCreate(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { courseId, title, userId } = body as {
      courseId: string;
      title: string;
      userId: string;
    };

    // TODO: Replace userId from body with authenticated user from Shibboleth

    // Check rate limit (10 sessions per hour)
    const isRateLimited = await checkSessionCreateRateLimit(userId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can create up to 10 sessions per hour." },
        { status: 429 }
      );
    }

    // Create session (includes professor role validation)
    const result = await createSession({ courseId, title, userId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    return NextResponse.json({ session: result.session }, { status: 201 });
  } catch (error) {
    console.error("[Sessions API] Failed to create session:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the session." },
      { status: 500 }
    );
  }
}
