import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { answerRateLimit } from "@/lib/redisKeys";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ANSWER_MIN_LENGTH = 1;
export const ANSWER_MAX_LENGTH = 1000;
export const RATE_LIMIT_COUNT = 15;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface QuestionValidationResult {
  valid: boolean;
  error?: string;
  question?: {
    id: string;
    sessionId: string;
  };
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates answer content.
 * Checks that content is a non-empty string within the allowed length bounds.
 */
export function validateAnswerContent(content: unknown): ValidationResult {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Answer content is required." };
  }

  const trimmed = content.trim();

  if (trimmed.length < ANSWER_MIN_LENGTH) {
    return {
      valid: false,
      error: `Answer must be at least ${ANSWER_MIN_LENGTH} character.`,
    };
  }

  if (trimmed.length > ANSWER_MAX_LENGTH) {
    return {
      valid: false,
      error: `Answer must be no more than ${ANSWER_MAX_LENGTH} characters.`,
    };
  }

  return { valid: true };
}

/**
 * Checks whether the given user has exceeded the answer rate limit
 * (15 answers per 60-second window).
 * Returns true if the limit has been exceeded.
 */
export async function checkAnswerRateLimit(userId: string): Promise<boolean> {
  return checkRateLimit(answerRateLimit(userId), RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_SECONDS);
}

/**
 * Validates that a question exists and belongs to an active session.
 * Returns the question with sessionId if valid, or an error message if not.
 */
export async function validateQuestionForAnswers(
  questionId: string
): Promise<QuestionValidationResult> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      sessionId: true,
      session: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!question) {
    return { valid: false, error: "Question not found." };
  }

  if (question.session.status === "ENDED") {
    return {
      valid: false,
      error: "Cannot answer questions in an ended session.",
    };
  }

  return {
    valid: true,
    question: {
      id: question.id,
      sessionId: question.sessionId,
    },
  };
}
