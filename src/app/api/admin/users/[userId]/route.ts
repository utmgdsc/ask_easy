import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, adminGuardResponse } from "@/lib/adminAuth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/users/[userId]
//
// TODO (Backend): Implement cascading delete in a $transaction.
//   1. Delete QuestionUpvote where userId
//   2. Delete AnswerUpvote where userId
//   3. Delete Answer where authorId
//   4. Delete Question where authorId
//   5. Delete CourseEnrollment where userId
//   6. Delete SlideSet where uploadedBy (+ delete files from disk)
//   7. Delete Session where createdById (+ cascade their Q&A)
//   8. Delete Course where createdById
//   9. Delete the User
//
// See src/app/api/courses/[courseId]/route.ts for the cascade pattern.
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    const guard = adminGuardResponse(user);
    if (guard) return guard;

    const { userId } = await params;

    // TODO: Implement cascading user deletion
    console.warn(`[Admin Users] DELETE user ${userId} — not yet implemented`);
    return NextResponse.json(
      { error: "User deletion not yet implemented. Assign to backend developer." },
      { status: 501 }
    );
  } catch (error) {
    console.error("[Admin Users] Failed to delete user:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
