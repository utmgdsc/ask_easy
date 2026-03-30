import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, adminGuardResponse } from "@/lib/adminAuth";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/sessions/[sessionId]
//
// TODO (Backend): Implement cascading delete in a $transaction.
//
// Steps:
//   1. Get all question IDs for the session
//   2. Delete QuestionUpvote for those questions
//   3. Delete Answer for those questions (AnswerUpvote cascades via onDelete)
//   4. Delete Question rows
//   5. Delete slide files from disk + SlideSet rows
//   6. Delete the Session
//
// See src/app/api/courses/[courseId]/route.ts for the cascade pattern.
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAdmin();
    const guard = adminGuardResponse(user);
    if (guard) return guard;

    const { sessionId } = await params;

    // TODO: Implement cascading session deletion (see instructions above)
    console.warn(`[Admin Sessions] DELETE session ${sessionId} — not yet implemented`);
    return NextResponse.json(
      { error: "Session deletion not yet implemented. Assign to backend developer." },
      { status: 501 }
    );
  } catch (error) {
    console.error("[Admin Sessions] Failed to delete session:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
