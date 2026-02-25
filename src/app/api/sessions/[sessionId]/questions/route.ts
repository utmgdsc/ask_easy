import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildQuestionsWhere,
  getQuestionsOrderBy,
  parseQuestionsQueryParams,
} from "@/lib/questionFilters";
import {
  validateQuestionContent,
  validateVisibility,
  checkQuestionRateLimit,
  validateSessionForQuestions,
} from "@/lib/questionValidation";
import { getSessionMembership } from "@/lib/sessionService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

interface QuestionCreateBody {
  content: string;
  authorId: string; // Required for REST API (no socket auth)
  visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
  isAnonymous?: boolean;
  slideId?: string;
}

// ---------------------------------------------------------------------------
// GET /api/sessions/[sessionId]/questions
// ---------------------------------------------------------------------------

/**
 * Retrieves questions for a session with cursor-based pagination, filters, and role-based visibility.
 *
 * Requires authentication (placeholder: x-user-id or Authorization Bearer header).
 * User must be enrolled in the session's course.
 *
 * Query parameters:
 *   - limit: number (default 20, max 50)
 *   - cursor: id of last question from previous page
 *   - search: partial case-insensitive match on content
 *   - slideId: filter by slide
 *   - status: OPEN | ANSWERED | RESOLVED
 *   - sortBy: newest | votes (default newest)
 *   - includeTotal: true to include total matching count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const userId = getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const membership = await getSessionMembership(sessionId, userId);
    if (!membership.valid || !membership.role) {
      const statusCode = membership.statusCode ?? 403;
      return NextResponse.json({ error: membership.error ?? "Forbidden." }, { status: statusCode });
    }

    const role = membership.role;
    const { searchParams } = new URL(request.url);
    const queryParams = parseQuestionsQueryParams(searchParams);
    const where = buildQuestionsWhere(sessionId, role, {
      search: queryParams.search,
      slideId: queryParams.slideId,
      status: queryParams.status,
    });

    let total: number | undefined;
    if (queryParams.includeTotal) {
      total = await prisma.question.count({ where });
    }

    const take = queryParams.limit + 1;
    const orderBy = getQuestionsOrderBy(queryParams.sortBy);
    const include = {
      author: { select: { id: true, name: true } },
      _count: { select: { answers: true } },
      answers: { where: { isAccepted: true }, select: { id: true }, take: 1 },
    } as const;

    const questions =
      queryParams.cursor !== null
        ? await prisma.question.findMany({
            where,
            orderBy,
            take,
            cursor: { id: queryParams.cursor },
            skip: 1,
            include,
          })
        : await prisma.question.findMany({
            where,
            orderBy,
            take,
            include,
          });

    const hasMore = questions.length > queryParams.limit;
    const page = hasMore ? questions.slice(0, queryParams.limit) : questions;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    const canRevealAnonymous = role === "TA" || role === "PROFESSOR";

    const transformedQuestions = page.map((q) => ({
      id: q.id,
      content: q.content,
      visibility: q.visibility,
      status: q.status,
      isAnonymous: q.isAnonymous,
      upvoteCount: q.upvoteCount,
      answerCount: q._count.answers,
      hasAcceptedAnswer: q.answers.length > 0,
      acceptedAnswerId: q.answers[0]?.id ?? null,
      slideId: q.slideId,
      createdAt: q.createdAt,
      author: q.isAnonymous && !canRevealAnonymous ? null : q.author,
    }));

    const payload: {
      sessionId: string;
      questions: typeof transformedQuestions;
      nextCursor: string | null;
      count: number;
      total?: number;
    } = {
      sessionId,
      questions: transformedQuestions,
      nextCursor,
      count: transformedQuestions.length,
    };
    if (total !== undefined) {
      payload.total = total;
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[Questions API] Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching questions." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/sessions/[sessionId]/questions
// ---------------------------------------------------------------------------

/**
 * Creates a new question in the given session.
 *
 * Request body:
 *   - content: string (required, 5-500 characters)
 *   - authorId: string (required)
 *   - visibility: "PUBLIC" | "INSTRUCTOR_ONLY" (optional, defaults to PUBLIC)
 *   - isAnonymous: boolean (optional, defaults to false)
 *   - slideId: string (optional)
 *
 * Validations:
 *   1. Content length bounds
 *   2. Visibility is valid if provided
 *   3. Rate limit (10 questions per 60 seconds per user)
 *   4. Session exists and has submissions enabled
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Parse request body
    let body: QuestionCreateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // TO-DO: check with auth to make sure that authorId being sent matches with the auth id, prevent custom body requests

    // 1. Validate authorId is provided
    if (!body.authorId || typeof body.authorId !== "string") {
      return NextResponse.json({ error: "Author ID is required." }, { status: 400 });
    }

    // 2. Validate content using shared validation
    const contentValidation = validateQuestionContent(body.content);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    // 3. Validate visibility using shared validation
    const visibilityValidation = validateVisibility(body.visibility);
    if (!visibilityValidation.valid) {
      return NextResponse.json({ error: visibilityValidation.error }, { status: 400 });
    }

    // 4. Validate session using shared validation
    const sessionValidation = await validateSessionForQuestions(sessionId);
    if (!sessionValidation.valid) {
      const statusCode = sessionValidation.error === "Session not found." ? 404 : 403;
      return NextResponse.json({ error: sessionValidation.error }, { status: statusCode });
    }

    // 5. Check rate limit using shared validation
    const isRateLimited = await checkQuestionRateLimit(body.authorId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before asking another question." },
        { status: 429 }
      );
    }

    // 6. Create the question
    const question = await prisma.question.create({
      data: {
        sessionId,
        authorId: body.authorId,
        content: body.content.trim(),
        visibility: body.visibility ?? "PUBLIC",
        isAnonymous: body.isAnonymous ?? false,
        slideId: body.slideId ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 7. Return the created question (respecting anonymity)
    return NextResponse.json(
      {
        id: question.id,
        content: question.content,
        visibility: question.visibility,
        status: question.status,
        isAnonymous: question.isAnonymous,
        upvoteCount: question.upvoteCount,
        slideId: question.slideId,
        createdAt: question.createdAt,
        author: question.isAnonymous ? null : question.author,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Questions API] Failed to create question:", error);
    return NextResponse.json(
      { error: "An error occurred while creating your question." },
      { status: 500 }
    );
  }
}
