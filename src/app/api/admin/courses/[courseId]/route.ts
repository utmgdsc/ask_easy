import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, adminGuardResponse } from "@/lib/adminAuth";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/courses/[courseId]
//
// TODO (Backend): Implement cascading delete in a $transaction.
// Reuse the pattern from src/app/api/courses/[courseId]/route.ts (lines 134-178)
// but skip the professor-owner check (admin bypasses ownership).
//
// Steps:
//   1. Gather session IDs for the course
//   2. Delete slide files from disk + SlideSet rows
//   3. Delete QuestionUpvote, Answer, Question for those sessions
//   4. Delete Sessions
//   5. Delete CourseEnrollment
//   6. Delete Course
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    const guard = adminGuardResponse(user);
    if (guard) return guard;

    const { courseId } = await params;

    // TODO: Implement cascading course deletion (see instructions above)
    console.warn(`[Admin Courses] DELETE course ${courseId} — not yet implemented`);
    return NextResponse.json(
      { error: "Course deletion not yet implemented. Assign to backend developer." },
      { status: 501 }
    );
  } catch (error) {
    console.error("[Admin Courses] Failed to delete course:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
