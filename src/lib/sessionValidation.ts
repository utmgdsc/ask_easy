import { checkRateLimit } from "@/lib/rateLimit";
import { sessionCreateRateLimit } from "@/lib/redisKeys";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_TITLE_MIN_LENGTH = 3;
export const SESSION_TITLE_MAX_LENGTH = 100;
export const SESSION_CREATE_RATE_LIMIT_COUNT = 10;
export const SESSION_CREATE_RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SessionCreateData {
  courseId: string;
  title: string;
  userId: string;
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates session title.
 * Checks that title is a non-empty string within the allowed length bounds (3-100 chars).
 * Title is trimmed of leading/trailing whitespace before validation.
 */
export function validateSessionTitle(title: unknown): ValidationResult {
  if (!title || typeof title !== "string") {
    return { valid: false, error: "Session title is required." };
  }

  const trimmed = title.trim();

  if (trimmed.length < SESSION_TITLE_MIN_LENGTH) {
    return {
      valid: false,
      error: `Session title must be at least ${SESSION_TITLE_MIN_LENGTH} characters.`,
    };
  }

  if (trimmed.length > SESSION_TITLE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Session title must be no more than ${SESSION_TITLE_MAX_LENGTH} characters.`,
    };
  }

  return { valid: true };
}

/**
 * Validates all fields required for session creation.
 * Returns validation result with error message if any field is invalid.
 */
export function validateSessionCreate(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }

  const body = data as Record<string, unknown>;

  // Validate userId
  if (!body.userId || typeof body.userId !== "string") {
    return { valid: false, error: "User ID is required." };
  }

  // Validate courseId
  if (!body.courseId || typeof body.courseId !== "string") {
    return { valid: false, error: "Course ID is required." };
  }

  // Validate title
  const titleValidation = validateSessionTitle(body.title);
  if (!titleValidation.valid) {
    return titleValidation;
  }

  return { valid: true };
}

/**
 * Checks whether the given user has exceeded the session creation rate limit
 * (10 sessions per hour).
 * Returns true if the limit has been exceeded.
 */
export async function checkSessionCreateRateLimit(userId: string): Promise<boolean> {
  return checkRateLimit(
    sessionCreateRateLimit(userId),
    SESSION_CREATE_RATE_LIMIT_COUNT,
    SESSION_CREATE_RATE_LIMIT_WINDOW_SECONDS
  );
}
