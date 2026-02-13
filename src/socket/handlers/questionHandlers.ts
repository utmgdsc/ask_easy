import { type Server, type Socket } from "socket.io";

import { prisma } from "@/lib/prisma";
import {
  validateQuestionContent,
  validateVisibility,
  checkQuestionRateLimit,
  checkUpvoteRateLimit,
  checkResolveRateLimit,
  validateSessionForQuestions,
} from "@/lib/questionValidation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionCreatePayload {
  content: string;
  sessionId: string;
  visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
  isAnonymous?: boolean;
  slideId?: string;
}

interface QuestionBroadcastPayload {
  id: string;
  content: string;
  visibility: string;
  isAnonymous: boolean;
  slideId: string | null;
  createdAt: Date;
  authorId?: string | null;
}

interface QuestionUpvotePayload {
  questionId: string;
}

interface QuestionResolvePayload {
  questionId: string;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Broadcasts a newly created question to the appropriate session room.
 *
 * Room conventions (populated when users join a session):
 *   session:{sessionId}            — every participant
 *   session:{sessionId}:instructors — TAs and professors only
 *
 * PUBLIC questions go to the first room; INSTRUCTOR_ONLY questions go to the second.
 */
export function broadcastQuestion(
  io: Server,
  sessionId: string,
  question: QuestionBroadcastPayload
): void {
  const targetRoom =
    question.visibility === "INSTRUCTOR_ONLY"
      ? `session:${sessionId}:instructors`
      : `session:${sessionId}`;

  io.to(targetRoom).emit("question:created", question);
}

/**
 * Registers the `question:create` event listener on the given socket.
 *
 * Guard order (cheap-before-expensive):
 *   1. Auth          — socket.data.userId must exist (set by auth middleware)
 *   2. Payload shape — must be a non-null object
 *   3. Content       — length bounds via validateQuestionContent
 *   4. Visibility    — must be a recognised Visibility value if provided
 *   5. Rate limit    — 10 questions / 60 s per user, enforced in Redis
 *   6. Session       — must exist in the DB and have isSubmissionsEnabled === true
 *   7. Persist       — question written to the database (authorId always stored)
 *   8. Broadcast     — emitted to the correct room; authorId stripped when anonymous
 */
export function handleQuestionCreate(socket: Socket, io: Server): void {
  socket.on("question:create", async (payload: QuestionCreatePayload) => {
    try {
      // 1. Auth guard — userId is attached by socket auth middleware
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        socket.emit("question:error", { message: "Authentication required." });
        return;
      }

      // 2. Payload shape guard — socket events can arrive with any shape
      if (!payload || typeof payload !== "object") {
        socket.emit("question:error", { message: "Invalid request." });
        return;
      }

      // 3. Content validation
      const contentValidation = validateQuestionContent(payload.content);
      if (!contentValidation.valid) {
        socket.emit("question:error", { message: contentValidation.error });
        return;
      }

      // 4. Visibility validation
      const visibilityValidation = validateVisibility(payload.visibility);
      if (!visibilityValidation.valid) {
        socket.emit("question:error", { message: visibilityValidation.error });
        return;
      }

      // 5. Rate limit (first async check — only reached if all sync checks pass)
      const isRateLimited = await checkQuestionRateLimit(userId);
      if (isRateLimited) {
        socket.emit("question:error", {
          message:
            "You have reached the question limit. Please wait before asking another question.",
        });
        return;
      }

      // 6. Session validation
      const sessionValidation = await validateSessionForQuestions(payload.sessionId);
      if (!sessionValidation.valid) {
        socket.emit("question:error", { message: sessionValidation.error });
        return;
      }

      // 7. Persist to database
      //    authorId is always stored for audit purposes, but it is stripped
      //    from the broadcast payload in step 8 when isAnonymous is true.
      const question = await prisma.question.create({
        data: {
          sessionId: payload.sessionId,
          authorId: userId,
          content: payload.content.trim(),
          visibility: payload.visibility ?? "PUBLIC",
          isAnonymous: payload.isAnonymous ?? false,
          slideId: payload.slideId ?? null,
        },
      });

      // 8. Build broadcast payload and emit to the session room
      const broadcastPayload: QuestionBroadcastPayload = {
        id: question.id,
        content: question.content,
        visibility: question.visibility,
        isAnonymous: question.isAnonymous,
        slideId: question.slideId,
        createdAt: question.createdAt,
        ...(question.isAnonymous ? {} : { authorId: question.authorId }),
      };

      broadcastQuestion(io, question.sessionId, broadcastPayload);
    } catch (error) {
      console.error("[QuestionHandler] Failed to create question:", error);
      socket.emit("question:error", {
        message: "An error occurred while creating your question.",
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Upvoting
// ---------------------------------------------------------------------------

/**
 * Registers the `question:upvote` event listener on the given socket.
 *
 * Guard order (cheap-before-expensive):
 *   1. Auth          — socket.data.userId must exist
 *   2. Payload shape — must be a non-null object with a string questionId
 *   3. Rate limit    — 30 upvotes / 60 s per user, enforced in Redis
 *   4. Toggle        — create or delete upvote + update count in a transaction
 *   5. Broadcast     — emit updated count to the session room
 */
export function handleQuestionUpvote(socket: Socket, io: Server): void {
  socket.on("question:upvote", async (payload: QuestionUpvotePayload) => {
    try {
      // 1. Auth guard
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        socket.emit("question:error", { message: "Authentication required." });
        return;
      }

      // 2. Payload shape guard
      if (!payload || typeof payload !== "object") {
        socket.emit("question:error", { message: "Invalid request." });
        return;
      }

      const { questionId } = payload;
      if (!questionId || typeof questionId !== "string") {
        socket.emit("question:error", { message: "Question ID is required." });
        return;
      }

      // 3. Rate limit
      const isRateLimited = await checkUpvoteRateLimit(userId);
      if (isRateLimited) {
        socket.emit("question:error", {
          message: "You are upvoting too quickly. Please wait before trying again.",
        });
        return;
      }

      // 4. Toggle upvote in a transaction
      const existingUpvote = await prisma.questionUpvote.findUnique({
        where: { questionId_userId: { questionId, userId } },
      });

      let updatedQuestion;

      if (existingUpvote) {
        // Remove upvote
        [, updatedQuestion] = await prisma.$transaction([
          prisma.questionUpvote.delete({ where: { id: existingUpvote.id } }),
          prisma.question.update({
            where: { id: questionId },
            data: { upvoteCount: { decrement: 1 } },
            select: { id: true, upvoteCount: true, sessionId: true, visibility: true },
          }),
        ]);
      } else {
        // Add upvote
        [, updatedQuestion] = await prisma.$transaction([
          prisma.questionUpvote.create({ data: { questionId, userId } }),
          prisma.question.update({
            where: { id: questionId },
            data: { upvoteCount: { increment: 1 } },
            select: { id: true, upvoteCount: true, sessionId: true, visibility: true },
          }),
        ]);
      }

      // 5. Broadcast to the appropriate room
      const targetRoom =
        updatedQuestion.visibility === "INSTRUCTOR_ONLY"
          ? `session:${updatedQuestion.sessionId}:instructors`
          : `session:${updatedQuestion.sessionId}`;

      io.to(targetRoom).emit("question:updated", {
        id: updatedQuestion.id,
        upvoteCount: updatedQuestion.upvoteCount,
      });
    } catch (error) {
      console.error("[QuestionHandler] Failed to toggle upvote:", error);
      socket.emit("question:error", {
        message: "An error occurred while processing your upvote.",
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Resolving
// ---------------------------------------------------------------------------

/**
 * Checks whether a user has permission to resolve a question.
 *
 * - TA / PROFESSOR can resolve any question.
 * - STUDENT can only resolve their own question.
 */
function checkResolvePermission(
  userId: string,
  questionAuthorId: string | null,
  userRole: "STUDENT" | "TA" | "PROFESSOR"
): boolean {
  if (userRole === "TA" || userRole === "PROFESSOR") {
    return true;
  }
  return questionAuthorId === userId;
}

/**
 * Registers the `question:resolve` event listener on the given socket.
 *
 * Guard order (cheap-before-expensive):
 *   1. Auth          — socket.data.userId must exist
 *   2. Payload shape — must be a non-null object with a string questionId
 *   3. Rate limit    — 20 resolves / 60 s per user, enforced in Redis
 *   4. Question      — must exist in the DB and not already be resolved
 *   5. Permission    — TA/PROFESSOR can resolve any; STUDENT only their own
 *   6. Persist       — question status updated to RESOLVED
 *   7. Broadcast     — emit resolved status to the session room
 */
export function handleQuestionResolve(socket: Socket, io: Server): void {
  socket.on("question:resolve", async (payload: QuestionResolvePayload) => {
    try {
      // 1. Auth guard
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        socket.emit("question:error", { message: "Authentication required." });
        return;
      }

      // 2. Payload shape guard
      if (!payload || typeof payload !== "object") {
        socket.emit("question:error", { message: "Invalid request." });
        return;
      }

      const { questionId } = payload;
      if (!questionId || typeof questionId !== "string") {
        socket.emit("question:error", { message: "Question ID is required." });
        return;
      }

      // 3. Rate limit
      const isRateLimited = await checkResolveRateLimit(userId);
      if (isRateLimited) {
        socket.emit("question:error", {
          message: "You are resolving too quickly. Please wait before trying again.",
        });
        return;
      }

      // 4. Fetch question
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, sessionId: true, authorId: true, status: true, visibility: true },
      });

      if (!question) {
        socket.emit("question:error", { message: "Question not found." });
        return;
      }

      if (question.status === "RESOLVED") {
        socket.emit("question:error", { message: "Question is already resolved." });
        return;
      }

      // 5. Permission check — fetch user role from DB
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        socket.emit("question:error", { message: "User not found." });
        return;
      }

      if (!checkResolvePermission(userId, question.authorId, user.role)) {
        socket.emit("question:error", {
          message: "You do not have permission to resolve this question.",
        });
        return;
      }

      // 6. Update status
      await prisma.question.update({
        where: { id: questionId },
        data: { status: "RESOLVED" },
      });

      // 7. Broadcast to the appropriate room
      const targetRoom =
        question.visibility === "INSTRUCTOR_ONLY"
          ? `session:${question.sessionId}:instructors`
          : `session:${question.sessionId}`;

      io.to(targetRoom).emit("question:resolved", {
        id: questionId,
        status: "RESOLVED",
      });
    } catch (error) {
      console.error("[QuestionHandler] Failed to resolve question:", error);
      socket.emit("question:error", {
        message: "An error occurred while resolving the question.",
      });
    }
  });
}
