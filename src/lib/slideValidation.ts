import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { slideUploadRateLimit } from "@/lib/redisKeys";
import { validatePdf, hasPdfMagicBytes } from "@/lib/pdf";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SLIDE_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SLIDE_MIN_FILE_SIZE = 1024; // 1KB
export const VALID_MIME_TYPES = new Set<string>(["application/pdf"]);
export const RATE_LIMIT_COUNT = 5;
export const RATE_LIMIT_WINDOW_SECONDS = 300; // 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SessionValidationResult {
  valid: boolean;
  error?: string;
  session?: {
    id: string;
    status: string;
  };
}

export interface UserRoleValidationResult {
  valid: boolean;
  error?: string;
  isProfessor?: boolean;
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates that the file MIME type is PDF.
 */
export function validateFileType(mimeType: string | null): ValidationResult {
  if (!mimeType || !VALID_MIME_TYPES.has(mimeType)) {
    return {
      valid: false,
      error: "Invalid file type. Only PDF files are accepted.",
    };
  }

  return { valid: true };
}

/**
 * Validates file size is within acceptable bounds.
 * Returns specific error codes for different size violations.
 */
export function validateFileSize(size: number): ValidationResult & { statusCode?: number } {
  if (size < SLIDE_MIN_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too small. Minimum size is ${SLIDE_MIN_FILE_SIZE} bytes.`,
      statusCode: 400,
    };
  }

  if (size > SLIDE_MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${SLIDE_MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      statusCode: 413,
    };
  }

  return { valid: true };
}

/**
 * Validates PDF content by checking magic bytes and attempting to parse.
 * This catches corrupted or malformed PDFs.
 */
export async function validatePdfContent(buffer: Buffer): Promise<ValidationResult> {
  // Quick check for PDF magic bytes
  if (!hasPdfMagicBytes(buffer)) {
    return {
      valid: false,
      error: "Invalid PDF: file does not have PDF signature.",
    };
  }

  // Full PDF validation (parse attempt)
  return validatePdf(buffer);
}

/**
 * Checks whether the given user has exceeded the slide upload rate limit
 * (5 uploads per 5-minute window).
 * Returns true if the limit has been exceeded.
 */
export async function checkSlideUploadRateLimit(userId: string): Promise<boolean> {
  return checkRateLimit(slideUploadRateLimit(userId), RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_SECONDS);
}

/**
 * Validates that a session exists and is in a valid state for uploads.
 */
export async function validateSessionForUpload(
  sessionId: string
): Promise<SessionValidationResult> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    return { valid: false, error: "Session not found." };
  }

  if (session.status === "ENDED") {
    return {
      valid: false,
      error: "Cannot upload slides to an ended session.",
    };
  }

  return { valid: true, session };
}

/**
 * Validates that the user is a professor for the session's course.
 * Returns true if the user has professor role in the course enrollment.
 */
export async function validateUserIsProfessor(
  userId: string,
  sessionId: string
): Promise<UserRoleValidationResult> {
  // Find the session and check if user is enrolled as professor in the course
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { courseId: true },
  });

  if (!session) {
    return { valid: false, error: "Session not found." };
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
    };
  }

  if (enrollment.role !== "PROFESSOR") {
    return {
      valid: false,
      error: "Only professors can upload slides.",
    };
  }

  return { valid: true, isProfessor: true };
}
