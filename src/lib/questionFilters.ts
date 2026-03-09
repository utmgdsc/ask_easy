import type { Role } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_QUESTION_LIMIT = 20;
export const MAX_QUESTION_LIMIT = 50;

const VALID_STATUSES = new Set<string>(["OPEN", "ANSWERED", "RESOLVED"]);
const VALID_SORT_BY = new Set<string>(["newest", "votes"]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionsQueryParams {
  limit: number;
  cursor: string | null;
  search: string | null;
  slideId: string | null;
  status: "OPEN" | "ANSWERED" | "RESOLVED" | null;
  sortBy: "newest" | "votes";
  includeTotal: boolean;
}

// ---------------------------------------------------------------------------
// Visibility by role
// ---------------------------------------------------------------------------

/**
 * Returns the list of visibility values the viewer is allowed to see.
 * Students: PUBLIC only. TAs and Professors: PUBLIC + INSTRUCTOR_ONLY.
 */
export function getAllowedVisibilityForRole(role: Role): ("PUBLIC" | "INSTRUCTOR_ONLY")[] {
  if (role === "STUDENT") {
    return ["PUBLIC"];
  }
  return ["PUBLIC", "INSTRUCTOR_ONLY"];
}

// ---------------------------------------------------------------------------
// Query param parsing
// ---------------------------------------------------------------------------

/**
 * Parses and validates GET query params for the questions list endpoint.
 * Invalid enum values are ignored or defaulted.
 */
export function parseQuestionsQueryParams(searchParams: URLSearchParams): QuestionsQueryParams {
  const limitParam = searchParams.get("limit");
  let limit = DEFAULT_QUESTION_LIMIT;
  if (limitParam !== null) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      limit = Math.min(parsed, MAX_QUESTION_LIMIT);
    }
  }

  const cursorParam = searchParams.get("cursor");
  const cursor =
    cursorParam !== null && typeof cursorParam === "string" && cursorParam.trim().length > 0
      ? cursorParam.trim()
      : null;

  const searchParam = searchParams.get("search");
  const search =
    searchParam !== null && typeof searchParam === "string" && searchParam.trim().length > 0
      ? searchParam.trim()
      : null;

  const slideIdParam = searchParams.get("slideId");
  const slideId =
    slideIdParam !== null && typeof slideIdParam === "string" && slideIdParam.trim().length > 0
      ? slideIdParam.trim()
      : null;

  const statusParam = searchParams.get("status");
  const status =
    statusParam !== null && VALID_STATUSES.has(statusParam)
      ? (statusParam as "OPEN" | "ANSWERED" | "RESOLVED")
      : null;

  const sortByParam = searchParams.get("sortBy");
  const sortBy =
    sortByParam !== null && VALID_SORT_BY.has(sortByParam)
      ? (sortByParam as "newest" | "votes")
      : "newest";

  const includeTotalParam = searchParams.get("includeTotal");
  const includeTotal =
    includeTotalParam === "true" ||
    includeTotalParam === "1" ||
    includeTotalParam?.toLowerCase() === "true";

  return {
    limit,
    cursor,
    search,
    slideId,
    status,
    sortBy,
    includeTotal,
  };
}

// ---------------------------------------------------------------------------
// Where clause builder
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Builds the Prisma where object for listing questions.
 * Applies sessionId, visibility (from role), and optional status, slideId, search.
 * Returns a plain object compatible with prisma.question.findMany({ where }).
 */
export function buildQuestionsWhere(
  sessionId: string,
  role: Role,
  params: Pick<QuestionsQueryParams, "search" | "slideId" | "status">
): Record<string, any> {
  const visibilityValues = getAllowedVisibilityForRole(role);

  const where: Record<string, any> = {
    sessionId,
    visibility: { in: visibilityValues },
  };

  if (params.status !== null) {
    where.status = params.status;
  }

  if (params.slideId !== null) {
    where.slideId = params.slideId;
  }

  if (params.search !== null && params.search.length > 0) {
    where.content = {
      contains: params.search,
      mode: "insensitive",
    };
  }

  return where;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Returns the orderBy clause for the questions list based on sortBy.
 * Stable cursor: secondary sort by id ascending.
 */
export function getQuestionsOrderBy(sortBy: "newest" | "votes") {
  if (sortBy === "votes") {
    return [{ upvoteCount: "desc" as const }, { id: "asc" as const }];
  }
  return [{ createdAt: "desc" as const }, { id: "asc" as const }];
}
