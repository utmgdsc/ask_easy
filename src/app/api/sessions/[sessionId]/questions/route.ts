import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  validateQuestionContent,
  validateVisibility,
  checkQuestionRateLimit,
  validateSessionForQuestions,
} from "@/lib/questionValidation";

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
 * Retrieves all questions for a given session.
 *
 * Query parameters:
 *   - visibility: "PUBLIC" | "INSTRUCTOR_ONLY" (optional filter)
 *   - status: "OPEN" | "ANSWERED" | "RESOLVED" (optional filter)
 *
 * Returns questions ordered by createdAt descending (newest first).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Parse optional query parameters for filtering
    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get("visibility");
    const status = searchParams.get("status");

    // Build dynamic where clause
    const where: {
      sessionId: string;
      visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
      status?: "OPEN" | "ANSWERED" | "RESOLVED";
    } = { sessionId };

    if (visibility === "PUBLIC" || visibility === "INSTRUCTOR_ONLY") {
      where.visibility = visibility;
    }

    if (status === "OPEN" || status === "ANSWERED" || status === "RESOLVED") {
      where.status = status;
    }

    // Fetch questions with author info (respecting anonymity)
    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { answers: true },
        },
      },
    });

    // Transform response to respect anonymity
    const transformedQuestions = questions.map((q) => ({
      id: q.id,
      content: q.content,
      visibility: q.visibility,
      status: q.status,
      isAnonymous: q.isAnonymous,
      upvoteCount: q.upvoteCount,
      answerCount: q._count.answers,
      slideId: q.slideId,
      createdAt: q.createdAt,
      // Only include author info if not anonymous
      author: q.isAnonymous ? null : q.author,
    }));

    return NextResponse.json({
      sessionId,
      questions: transformedQuestions,
      count: transformedQuestions.length,
    });
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

    // 4. Check rate limit using shared validation
    const isRateLimited = await checkQuestionRateLimit(body.authorId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before asking another question." },
        { status: 429 }
      );
    }

    // 5. Validate session using shared validation
    const sessionValidation = await validateSessionForQuestions(sessionId);
    if (!sessionValidation.valid) {
      const statusCode = sessionValidation.error === "Session not found." ? 404 : 403;
      return NextResponse.json({ error: sessionValidation.error }, { status: statusCode });
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
