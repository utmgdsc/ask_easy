import { randomInt } from "crypto";

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Characters for join code generation (excluding ambiguous chars: 0, O, I, L, 1)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_MAX_RETRIES = 10;

// ---------------------------------------------------------------------------
// Code Generation Functions
// ---------------------------------------------------------------------------

/**
 * Generates a random session code using cryptographically secure randomness.
 * Does NOT check for uniqueness - use generateUniqueSessionCode for that.
 *
 * @param length - Code length (default: 6)
 * @returns A random session code string
 */
export function generateSessionCode(length: number = DEFAULT_CODE_LENGTH): string {
  return Array.from({ length }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
}

/**
 * Checks if a session code is available (not already in use).
 * Lookup is case-insensitive.
 *
 * @param code - The code to check
 * @returns True if the code is available, false if already in use
 */
export async function isCodeAvailable(code: string): Promise<boolean> {
  const existing = await prisma.session.findUnique({
    where: { joinCode: code.toUpperCase() },
    select: { id: true },
  });
  return !existing;
}

/**
 * Generates a unique session code with collision detection.
 * Uses cryptographically secure randomness and retries on collision.
 *
 * @param maxRetries - Maximum retry attempts (default: 10)
 * @returns A unique session code string
 * @throws Error if unable to generate unique code after max retries
 */
export async function generateUniqueSessionCode(
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateSessionCode();

    if (await isCodeAvailable(code)) {
      return code;
    }
  }

  throw new Error("Failed to generate unique session code after maximum attempts.");
}

/**
 * Regenerates the session code for a session.
 * Only the session creator can regenerate the code.
 * Does NOT affect already-registered students.
 *
 * @param sessionId - The session to regenerate code for
 * @param userId - The user requesting regeneration (must be creator)
 * @returns The new session code, or null with error info
 */
export async function regenerateSessionCode(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; code?: string; error?: string; statusCode?: number }> {
  // Find session and verify ownership
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, createdById: true, status: true },
  });

  if (!session) {
    return { success: false, error: "Session not found.", statusCode: 404 };
  }

  if (session.createdById !== userId) {
    return {
      success: false,
      error: "Only the session creator can regenerate the code.",
      statusCode: 403,
    };
  }

  if (session.status === "ENDED") {
    return {
      success: false,
      error: "Cannot regenerate code for an ended session.",
      statusCode: 400,
    };
  }

  // Generate new unique code
  const newCode = await generateUniqueSessionCode();

  // Update session with new code
  await prisma.session.update({
    where: { id: sessionId },
    data: { joinCode: newCode },
  });

  return { success: true, code: newCode };
}
