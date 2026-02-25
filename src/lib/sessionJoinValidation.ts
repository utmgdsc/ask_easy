import { checkRateLimit } from "@/lib/rateLimit";
import { sessionJoinLookupRateLimit, sessionJoinRegisterRateLimit } from "@/lib/redisKeys";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_JOIN_LOOKUP_RATE_LIMIT_COUNT = 30;
export const SESSION_JOIN_LOOKUP_RATE_LIMIT_WINDOW_SECONDS = 60;

export const SESSION_JOIN_REGISTER_RATE_LIMIT_COUNT = 10;
export const SESSION_JOIN_REGISTER_RATE_LIMIT_WINDOW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SessionJoinData {
  userId: string;
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates the request body for session join.
 * Checks that userId is a non-empty string.
 */
export function validateSessionJoinRequest(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }

  const body = data as Record<string, unknown>;

  if (!body.userId || typeof body.userId !== "string") {
    return { valid: false, error: "User ID is required." };
  }

  return { valid: true };
}

/**
 * Checks whether the given user has exceeded the session join lookup rate limit
 * (30 lookups per minute).
 * Returns true if the limit has been exceeded.
 */
export async function checkSessionJoinLookupRateLimit(userId: string): Promise<boolean> {
  return checkRateLimit(
    sessionJoinLookupRateLimit(userId),
    SESSION_JOIN_LOOKUP_RATE_LIMIT_COUNT,
    SESSION_JOIN_LOOKUP_RATE_LIMIT_WINDOW_SECONDS
  );
}

/**
 * Checks whether the given user has exceeded the session join registration rate limit
 * (10 registrations per minute).
 * Returns true if the limit has been exceeded.
 */
export async function checkSessionJoinRegisterRateLimit(userId: string): Promise<boolean> {
  return checkRateLimit(
    sessionJoinRegisterRateLimit(userId),
    SESSION_JOIN_REGISTER_RATE_LIMIT_COUNT,
    SESSION_JOIN_REGISTER_RATE_LIMIT_WINDOW_SECONDS
  );
}
