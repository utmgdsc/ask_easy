import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/sessions/[sessionId]/my-role
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's effective role for the session.
 *
 * - PROFESSOR: user has global role PROFESSOR (set by whitelist at login)
 * - TA:        user has CourseEnrollment.role === "TA" for the session's course
 * - STUDENT:   everyone else
 *
 * This allows the room to distinguish TAs (who are assigned per-course)
 * from regular students without touching the global User.role.
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

    const role = enrollment?.role ?? "STUDENT";

    return NextResponse.json({ role });
  } catch (error) {
    console.error("[Sessions API] Failed to resolve user role:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
