import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  validateAnswerContent,
  checkAnswerRateLimit,
  validateQuestionForAnswers,
} from "@/lib/answerValidation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ questionId: string }>;
}

interface AnswerCreateBody {
  content: string;
  authorId: string; // Required for REST API (no socket auth)
}

// ---------------------------------------------------------------------------
// GET /api/questions/[questionId]/answers
// ---------------------------------------------------------------------------

/**
 * Retrieves all answers for a given question.
 *
 * Returns answers ordered by createdAt ascending (oldest first).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;

    // Validate question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    // Fetch answers with author info
    const answers = await prisma.answer.findMany({
      where: { questionId },
      orderBy: { createdAt: "asc" },
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

    // Transform response
    const transformedAnswers = answers.map((a) => ({
      id: a.id,
      questionId: a.questionId,
      content: a.content,
      authorId: a.author.id,
      authorName: a.author.name,
      authorRole: a.author.role,
      isAccepted: a.isAccepted,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      questionId,
      answers: transformedAnswers,
      count: transformedAnswers.length,
    });
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
 *   - content: string (required, 1-2000 characters)
 *   - authorId: string (required)
 *
 * Validations:
 *   1. Content length bounds
 *   2. Rate limit (15 answers per 60 seconds per user)
 *   3. Question exists and belongs to an active session
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;

    // Parse request body
    let body: AnswerCreateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // TO-DO: check with auth to make sure that authorId being sent matches with the auth id

    // 1. Validate authorId is provided
    if (!body.authorId || typeof body.authorId !== "string") {
      return NextResponse.json({ error: "Author ID is required." }, { status: 400 });
    }

    // 2. Validate content using shared validation
    const contentValidation = validateAnswerContent(body.content);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    // 3. Check rate limit using shared validation
    const isRateLimited = await checkAnswerRateLimit(body.authorId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before submitting another answer." },
        { status: 429 }
      );
    }

    // 4. Validate question using shared validation
    const questionValidation = await validateQuestionForAnswers(questionId);
    if (!questionValidation.valid) {
      const statusCode = questionValidation.error === "Question not found." ? 404 : 403;
      return NextResponse.json({ error: questionValidation.error }, { status: statusCode });
    }

    // 5. Create the answer
    const answer = await prisma.answer.create({
      data: {
        questionId,
        authorId: body.authorId,
        content: body.content.trim(),
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

    // 6. Return the created answer
    return NextResponse.json(
      {
        id: answer.id,
        questionId: answer.questionId,
        content: answer.content,
        authorId: answer.author.id,
        authorName: answer.author.name,
        authorRole: answer.author.role,
        isAccepted: answer.isAccepted,
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
