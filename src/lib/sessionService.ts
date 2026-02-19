import { prisma } from "@/lib/prisma";
import { generateUniqueSessionCode } from "@/lib/sessionCode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

  // Create session with SCHEDULED status
  const session = await prisma.session.create({
    data: {
      courseId,
      createdById: userId,
      title: title.trim(),
      joinCode,
      status: "SCHEDULED",
      isSubmissionsEnabled: false,
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
