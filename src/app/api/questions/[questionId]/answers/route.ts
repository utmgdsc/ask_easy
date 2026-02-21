import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  validateAnswerContent,
  checkAnswerRateLimit,
  validateQuestionForAnswers,
} from "@/lib/answerValidation";
import { getQuestionAnswers } from "@/services/answerService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ questionId: string }>;
}

interface AnswerCreateBody {
  content: string;
  authorId: string;
  isAnonymous?: boolean;
}

// ---------------------------------------------------------------------------
// GET /api/questions/[questionId]/answers
// ---------------------------------------------------------------------------

/**
 * Retrieves answers for a given question with cursor-based pagination.
 *
 * Query params:
 *   - userId  (required) — the requesting user, used for access control
 *   - cursor  (optional) — answer id to paginate from
 *   - limit   (optional) — page size (default 20, max 50)
 *
 * Returns answers sorted by: accepted first, then createdAt asc.
 * Anonymous answer authors are hidden from students.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;
    const { searchParams } = new URL(request.url);

    // TODO: replace with auth session once NextAuth.js is integrated
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
    }

    const cursor = searchParams.get("cursor") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const result = await getQuestionAnswers(questionId, userId, { cursor, limit });

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[Answers API] Failed to fetch answers:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching answers." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/questions/[questionId]/answers
// ---------------------------------------------------------------------------

/**
 * Creates a new answer for the given question.
 *
 * Request body:
 *   - content:     string  (required, 1-1000 characters)
 *   - authorId:    string  (required)
 *   - isAnonymous: boolean (optional, default false)
 *
 * Validations:
 *   1. Author ID provided
 *   2. Question exists and belongs to an active session
 *   3. Content length bounds
 *   4. Rate limit (15 answers per 60 seconds per user)
 *
 * Note: Question validation before rate limit prevents exhausting rate limit
 * quota on invalid requests (e.g., non-existent questions).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;

    let body: AnswerCreateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // TODO: check with auth to make sure that authorId being sent matches with the auth id

    if (!body.authorId || typeof body.authorId !== "string") {
      return NextResponse.json({ error: "Author ID is required." }, { status: 400 });
    }

    const questionValidation = await validateQuestionForAnswers(questionId);
    if (!questionValidation.valid) {
      const statusCode = questionValidation.error === "Question not found." ? 404 : 403;
      return NextResponse.json({ error: questionValidation.error }, { status: statusCode });
    }

    const contentValidation = validateAnswerContent(body.content);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    const isRateLimited = await checkAnswerRateLimit(body.authorId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before submitting another answer." },
        { status: 429 }
      );
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        authorId: body.authorId,
        content: body.content.trim(),
        isAnonymous: body.isAnonymous ?? false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: answer.id,
        questionId: answer.questionId,
        content: answer.content,
        authorId: answer.author.id,
        authorName: answer.author.name,
        authorRole: answer.author.role,
        isAccepted: answer.isAccepted,
        isAnonymous: answer.isAnonymous,
        createdAt: answer.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Answers API] Failed to create answer:", error);
    return NextResponse.json(
      { error: "An error occurred while creating your answer." },
      { status: 500 }
    );
  }
}
