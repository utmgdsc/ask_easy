import { prisma } from "@/lib/prisma";

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
// Constants
// ---------------------------------------------------------------------------

// Characters for join code generation (excluding confusing chars: 0/O, 1/I/L)
const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_LENGTH = 6;
const MAX_JOIN_CODE_ATTEMPTS = 10;

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
 * Generates a unique 6-character alphanumeric join code.
 * Retries up to MAX_JOIN_CODE_ATTEMPTS times if collision is detected.
 *
 * @returns A unique join code string
 * @throws Error if unable to generate unique code after max attempts
 */
export async function generateJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    const code = Array.from(
      { length: JOIN_CODE_LENGTH },
      () => JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)]
    ).join("");

    // Check if code already exists
    const existing = await prisma.session.findUnique({
      where: { joinCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Failed to generate unique join code after maximum attempts.");
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

  // Generate unique join code
  const joinCode = await generateJoinCode();

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
