import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/sessions/[sessionId]/my-role
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's effective role for the session.
 *
 * Role is resolved via CourseEnrollment for the session's course — never
 * from the global User.role. This ensures a professor not enrolled in
 * a course is not granted PROFESSOR privileges for it.
 *
 * Response format:
 *   - Success: { role, enrolled: true }
 *   - Failure: { error, enrolled: false } with 403 status
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Resolve role via CourseEnrollment for this specific session's course.
    // This ensures a professor not enrolled in the session's course is not
    // granted PROFESSOR privileges for it.
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { courseId: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: user.userId, courseId: session.courseId },
      },
      select: { role: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this session.", enrolled: false },
        { status: 403 }
      );
    }

    return NextResponse.json({ role: enrollment.role, enrolled: true });
  } catch (error) {
    console.error("[Sessions API] Failed to resolve user role:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
