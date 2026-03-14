import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function assertProfessorOwner(userId: string, courseId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { role: true },
  });
  if (!enrollment || enrollment.role !== "PROFESSOR") return false;
  return true;
}

// ---------------------------------------------------------------------------
// PATCH /api/courses/[courseId]
// ---------------------------------------------------------------------------

/**
 * Renames a course's code and/or semester.
 *
 * Request body: { code?: string; semester?: string }
 *
 * Only the professor enrolled in the course may call this.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!(await assertProfessorOwner(user.userId, courseId))) {
      return NextResponse.json(
        { error: "Only the course professor can rename this course." },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { code, semester } = (body as Record<string, unknown>) ?? {};

    if (code !== undefined && (typeof code !== "string" || code.trim().length === 0)) {
      return NextResponse.json({ error: "Course code cannot be empty." }, { status: 400 });
    }

    if (semester !== undefined && (typeof semester !== "string" || semester.trim().length === 0)) {
      return NextResponse.json({ error: "Semester cannot be empty." }, { status: 400 });
    }

    const updateData: { code?: string; name?: string; semester?: string } = {};
    if (typeof code === "string") {
      updateData.code = code.trim();
      updateData.name = code.trim(); // keep name in sync with code
    }
    if (typeof semester === "string") updateData.semester = semester.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      select: { id: true, code: true, name: true, semester: true },
    });

    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error("[Courses API] Failed to rename course:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/courses/[courseId]
// ---------------------------------------------------------------------------

/**
 * Permanently deletes a course and all related data.
 *
 * Rejects if the course has an ACTIVE session.
 * Deletes slide files from disk before removing DB records.
 * Manual deletion order (no cascades on Course):
 *   QuestionUpvote → Answer → Question → SlideSet files → SlideSet
 *   → Session → CourseEnrollment → Course
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!(await assertProfessorOwner(user.userId, courseId))) {
      return NextResponse.json(
        { error: "Only the course professor can delete this course." },
        { status: 403 }
      );
    }

    // Block deletion if an active session exists
    const activeSession = await prisma.session.findFirst({
      where: { courseId, status: "ACTIVE" },
      select: { id: true },
    });
    if (activeSession) {
      return NextResponse.json(
        { error: "Cannot delete a course with an active session. End the session first." },
        { status: 409 }
      );
    }

    // Gather all session IDs for this course
    const sessions = await prisma.session.findMany({
      where: { courseId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    await prisma.$transaction(async (tx) => {
      if (sessionIds.length > 0) {
        // Collect slide storage keys before deleting
        const slideSets = await tx.slideSet.findMany({
          where: { sessionId: { in: sessionIds } },
          select: { storageKey: true },
        });

        // Delete slide files from disk (outside transaction is fine too, but keep it together)
        await Promise.allSettled(
          slideSets.map((ss) =>
            deleteFile(ss.storageKey).catch((err) =>
              console.error("[Courses API] Failed to delete slide file:", ss.storageKey, err)
            )
          )
        );

        // Get question IDs to remove upvotes and answers
        const questions = await tx.question.findMany({
          where: { sessionId: { in: sessionIds } },
          select: { id: true },
        });
        const questionIds = questions.map((q) => q.id);

        if (questionIds.length > 0) {
          await tx.questionUpvote.deleteMany({ where: { questionId: { in: questionIds } } });
          await tx.answer.deleteMany({ where: { questionId: { in: questionIds } } });
          await tx.question.deleteMany({ where: { id: { in: questionIds } } });
        }

        // SlideSet (Slide rows cascade from SlideSet)
        await tx.slideSet.deleteMany({ where: { sessionId: { in: sessionIds } } });

        await tx.session.deleteMany({ where: { courseId } });
      }

      await tx.courseEnrollment.deleteMany({ where: { courseId } });
      await tx.course.delete({ where: { id: courseId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Courses API] Failed to delete course:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
