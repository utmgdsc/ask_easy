import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GetAnswersOptions {
  cursor?: string;
  limit?: number;
}

export interface AnswerAuthor {
  id: string;
  name: string;
  role: Role;
}

export interface AnswerResponse {
  id: string;
  questionId: string;
  content: string;
  author: AnswerAuthor | null;
  authorRole: Role;
  isAccepted: boolean;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface GetAnswersResult {
  answers: AnswerResponse[];
  nextCursor: string | null;
  acceptedAnswerId: string | null;
}

export interface GetAnswerByIdResult {
  answer: AnswerResponse;
  questionId: string;
}

export interface ServiceError {
  status: number;
  message: string;
}

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ServiceError };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the requesting user's role within the course that owns the
 * question's session. Returns `null` if the user is not enrolled.
 */
async function getUserCourseRole(userId: string, courseId: string): Promise<Role | null> {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { role: true },
  });
  return enrollment?.role ?? null;
}

/**
 * Returns `true` when the caller's enrollment role allows them to see the
 * identity behind anonymous content.
 */
function canRevealAnonymous(role: Role): boolean {
  return role === "TA" || role === "PROFESSOR";
}

/**
 * Strips author identity from an answer when it should be hidden from the
 * requesting user.
 */
function redactAuthorIfAnonymous(
  answer: {
    id: string;
    questionId: string;
    content: string;
    isAnonymous: boolean;
    isAccepted: boolean;
    createdAt: Date;
    author: { id: string; name: string; role: Role };
  },
  viewerCanReveal: boolean
): AnswerResponse {
  const hideAuthor = answer.isAnonymous && !viewerCanReveal;

  return {
    id: answer.id,
    questionId: answer.questionId,
    content: answer.content,
    author: hideAuthor
      ? null
      : {
          id: answer.author.id,
          name: answer.author.name,
          role: answer.author.role,
        },
    authorRole: answer.author.role,
    isAccepted: answer.isAccepted,
    isAnonymous: answer.isAnonymous,
    createdAt: answer.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches answers for a question with cursor-based pagination.
 *
 * Access rules:
 *   - User must be enrolled in the course that owns the session.
 *   - Students cannot view answers on INSTRUCTOR_ONLY questions.
 *
 * Sorting: accepted first, then by createdAt ascending, then by id ascending
 * (tie-breaker for stable pagination).
 *
 * Anonymity: anonymous answer authors are hidden from students; TAs and
 * professors can always see author identity.
 */
export async function getQuestionAnswers(
  questionId: string,
  userId: string,
  options: GetAnswersOptions = {}
): Promise<ServiceResult<GetAnswersResult>> {
  // ---- Validate question exists and load its context -----------------------
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      visibility: true,
      session: {
        select: {
          id: true,
          courseId: true,
        },
      },
    },
  });

  if (!question) {
    return { ok: false, error: { status: 404, message: "Question not found." } };
  }

  // ---- Enrollment check ----------------------------------------------------
  const viewerRole = await getUserCourseRole(userId, question.session.courseId);

  if (!viewerRole) {
    return {
      ok: false,
      error: { status: 403, message: "You are not enrolled in this course." },
    };
  }

  // ---- Visibility check ----------------------------------------------------
  if (question.visibility === "INSTRUCTOR_ONLY" && viewerRole === "STUDENT") {
    return {
      ok: false,
      error: {
        status: 403,
        message: "You do not have permission to view this question.",
      },
    };
  }

  // ---- Pagination setup ----------------------------------------------------
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  // Fetch one extra to determine if there's a next page
  const take = limit + 1;

  const cursorClause: Record<string, unknown> | undefined = options.cursor
    ? { cursor: { id: options.cursor }, skip: 1 }
    : undefined;

  // ---- Query answers -------------------------------------------------------
  const answers = await prisma.answer.findMany({
    where: { questionId },
    orderBy: [{ isAccepted: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    take,
    ...cursorClause,
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  // ---- Determine pagination cursor -----------------------------------------
  const hasMore = answers.length > limit;
  if (hasMore) answers.pop();

  const nextCursor = hasMore ? answers[answers.length - 1].id : null;

  // ---- Find accepted answer id (across all pages) --------------------------
  const acceptedAnswer = await prisma.answer.findFirst({
    where: { questionId, isAccepted: true },
    select: { id: true },
  });

  // ---- Redact anonymous authors for students -------------------------------
  const viewerCanReveal = canRevealAnonymous(viewerRole);

  const transformed: AnswerResponse[] = answers.map((a) =>
    redactAuthorIfAnonymous(a, viewerCanReveal)
  );

  return {
    ok: true,
    data: {
      answers: transformed,
      nextCursor,
      acceptedAnswerId: acceptedAnswer?.id ?? null,
    },
  };
}

/**
 * Fetches a single answer by id.
 *
 * Applies the same enrollment and visibility checks as `getQuestionAnswers`.
 */
export async function getAnswerById(
  answerId: string,
  userId: string
): Promise<ServiceResult<GetAnswerByIdResult>> {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
      question: {
        select: {
          id: true,
          visibility: true,
          session: {
            select: { courseId: true },
          },
        },
      },
    },
  });

  if (!answer) {
    return { ok: false, error: { status: 404, message: "Answer not found." } };
  }

  // ---- Enrollment check ----------------------------------------------------
  const viewerRole = await getUserCourseRole(userId, answer.question.session.courseId);

  if (!viewerRole) {
    return {
      ok: false,
      error: { status: 403, message: "You are not enrolled in this course." },
    };
  }

  // ---- Visibility check on parent question ---------------------------------
  if (answer.question.visibility === "INSTRUCTOR_ONLY" && viewerRole === "STUDENT") {
    return {
      ok: false,
      error: {
        status: 403,
        message: "You do not have permission to view this answer.",
      },
    };
  }

  const viewerCanReveal = canRevealAnonymous(viewerRole);

  return {
    ok: true,
    data: {
      answer: redactAuthorIfAnonymous(answer, viewerCanReveal),
      questionId: answer.questionId,
    },
  };
}
