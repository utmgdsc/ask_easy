import type { Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { generateUniqueSessionCode } from "@/lib/sessionCode";
import { deleteFile } from "@/lib/storage";
import { getIO } from "@/socket";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sessions with no activity for this long are automatically ended. */
export const SESSION_INACTIVITY_MS = 2 * 60 * 60 * 1000; // 2 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionMembershipResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
  role?: Role;
}

export interface ProfessorRoleValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

export interface SessionCreateInput {
  courseId: string;
  title: string;
  userId: string;
}

export interface SessionCreateResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  session?: {
    id: string;
    title: string;
    joinCode: string;
    status: string;
    courseId: string;
    createdById: string;
    createdAt: Date;
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Resolves session membership: returns the user's role in the session's course.
 * Use for authorization on session-scoped endpoints (e.g. list questions).
 *
 * @param sessionId - The session ID
 * @param userId - The user ID
 * @returns Success with role (STUDENT | TA | PROFESSOR), or error with statusCode (404 session not found, 403 not enrolled)
 */
export async function getSessionMembership(
  sessionId: string,
  userId: string
): Promise<SessionMembershipResult> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, courseId: true },
  });

  if (!session) {
    return {
      valid: false,
      error: "Session not found.",
      statusCode: 404,
    };
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: session.courseId,
      },
    },
    select: { role: true },
  });

  if (!enrollment) {
    return {
      valid: false,
      error: "You are not enrolled in this course.",
      statusCode: 403,
    };
  }

  return {
    valid: true,
    role: enrollment.role,
  };
}

/**
 * Validates that a user is a professor in the specified course.
 * Checks CourseEnrollment for PROFESSOR role.
 *
 * @param userId - The user ID to check
 * @param courseId - The course ID to check enrollment for
 * @returns Validation result with error and status code if invalid
 */
export async function validateProfessorRole(
  userId: string,
  courseId: string
): Promise<ProfessorRoleValidationResult> {
  // First check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    return {
      valid: false,
      error: "Course not found.",
      statusCode: 404,
    };
  }

  // Check user's enrollment in the course
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    select: { role: true },
  });

  if (!enrollment) {
    return {
      valid: false,
      error: "You are not enrolled in this course.",
      statusCode: 403,
    };
  }

  if (enrollment.role !== "PROFESSOR") {
    return {
      valid: false,
      error: "Only professors can create sessions.",
      statusCode: 403,
    };
  }

  return { valid: true };
}

/**
 * Creates a new session for a course.
 * Validates professor role and generates unique join code.
 *
 * @param data - Session creation data (courseId, title, userId)
 * @returns Result with created session or error
 */
export async function createSession(data: SessionCreateInput): Promise<SessionCreateResult> {
  const { courseId, title, userId } = data;

  // Validate professor role
  const roleValidation = await validateProfessorRole(userId, courseId);
  if (!roleValidation.valid) {
    return {
      success: false,
      error: roleValidation.error,
      statusCode: roleValidation.statusCode,
    };
  }

  // Generate unique join code (cryptographically secure)
  const joinCode = await generateUniqueSessionCode();

  // Create session as ACTIVE immediately so students can join right away
  const session = await prisma.session.create({
    data: {
      courseId,
      createdById: userId,
      title: title.trim(),
      joinCode,
      status: "ACTIVE",
      isSubmissionsEnabled: true,
      startTime: new Date(),
    },
    select: {
      id: true,
      title: true,
      joinCode: true,
      status: true,
      courseId: true,
      createdById: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    session,
  };
}

/**
 * Ends a session: marks it ENDED, broadcasts the socket event, then cleans up
 * all associated Q&A and slide files. Safe to call more than once — the DB
 * update is idempotent for already-ended sessions.
 *
 * @param sessionId - The session to end
 */
export async function performSessionEnd(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: "ENDED", endTime: new Date() },
  });

  try {
    const io = getIO();
    io.to(`session:${sessionId}`).emit("session:ended", {});
  } catch {
    // Socket.IO not initialised in test environments — safe to ignore
  }

  try {
    await prisma.question.deleteMany({ where: { sessionId } });
  } catch (err) {
    console.error("[SessionService] Failed to clean up Q&A for session:", sessionId, err);
  }

  try {
    const slideSets = await prisma.slideSet.findMany({
      where: { sessionId },
      select: { id: true, storageKey: true },
    });

    await Promise.allSettled(
      slideSets.map((ss) =>
        deleteFile(ss.storageKey).catch((err) =>
          console.error(`[SessionService] Failed to delete slide file ${ss.storageKey}:`, err)
        )
      )
    );

    if (slideSets.length > 0) {
      await prisma.slideSet.deleteMany({ where: { sessionId } });
    }
  } catch (err) {
    console.error("[SessionService] Failed to clean up slides for session:", sessionId, err);
  }
}

/**
 * Checks whether an ACTIVE session has been inactive for longer than
 * SESSION_INACTIVITY_MS and, if so, ends it automatically.
 *
 * @param sessionId - The session to check
 * @returns true if the session was auto-ended, false otherwise
 */
export async function checkAndAutoEnd(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { status: true, lastActivityAt: true },
  });

  if (!session || session.status !== "ACTIVE") {
    return false;
  }

  const inactiveMs = Date.now() - session.lastActivityAt.getTime();
  if (inactiveMs < SESSION_INACTIVITY_MS) {
    return false;
  }

  console.info(
    `[SessionService] Auto-ending session ${sessionId} after ${Math.round(inactiveMs / 60_000)} minutes of inactivity.`
  );
  await performSessionEnd(sessionId);
  return true;
}
