import { type Server, type Socket } from "socket.io";

import { prisma } from "@/lib/prisma";
import {
  validateAnswerContent,
  checkAnswerRateLimit,
  validateQuestionForAnswers,
} from "@/lib/answerValidation";
import type { AnswerCreatedPayload } from "@/socket/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerCreatePayload {
  questionId: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Broadcasts a newly created answer to the session room.
 *
 * Answers are always broadcast to all users in the session (no visibility filtering).
 */
export function broadcastAnswer(io: Server, sessionId: string, answer: AnswerCreatedPayload): void {
  io.to(`session:${sessionId}`).emit("answer:created", answer);
}

/**
 * Registers the `answer:create` event listener on the given socket.
 *
 * Guard order:
 *   1. Auth          — socket.data.userId must exist (set by auth middleware)
 *   2. Payload shape — must be a non-null object
 *   3. Question      — must exist in the DB and belong to an active session
 *   4. Content       — length bounds via validateAnswerContent
 *   5. Rate limit    — 15 answers / 60 s per user, enforced in Redis
 *   6. Persist       — answer written to the database
 *   7. Broadcast     — emitted to the session room
 *
 * Note: Question validation before rate limit prevents exhausting rate limit
 * quota on invalid requests (e.g., non-existent questions).
 */
export function handleAnswerCreate(socket: Socket, io: Server): void {
  socket.on("answer:create", async (payload: AnswerCreatePayload) => {
    try {
      // 1. Auth guard — userId is attached by socket auth middleware
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        socket.emit("answer:error", { message: "Authentication required." });
        return;
      }

      // 2. Payload shape guard — socket events can arrive with any shape
      if (!payload || typeof payload !== "object") {
        socket.emit("answer:error", { message: "Invalid request." });
        return;
      }

      // 3. Question validation — check early to avoid exhausting rate limit on invalid questions
      const questionValidation = await validateQuestionForAnswers(payload.questionId);
      if (!questionValidation.valid) {
        socket.emit("answer:error", { message: questionValidation.error });
        return;
      }

      // 4. Content validation
      const contentValidation = validateAnswerContent(payload.content);
      if (!contentValidation.valid) {
        socket.emit("answer:error", { message: contentValidation.error });
        return;
      }

      // 5. Rate limit — only increment after validating question exists
      const isRateLimited = await checkAnswerRateLimit(userId);
      if (isRateLimited) {
        socket.emit("answer:error", {
          message:
            "You have reached the answer limit. Please wait before submitting another answer.",
        });
        return;
      }

      // 6. Persist to database
      const answer = await prisma.answer.create({
        data: {
          questionId: payload.questionId,
          authorId: userId,
          content: payload.content.trim(),
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

      // 7. Build broadcast payload and emit to the session room
      const broadcastPayload: AnswerCreatedPayload = {
        id: answer.id,
        questionId: answer.questionId,
        content: answer.content,
        authorId: answer.author.id,
        authorName: answer.author.name,
        authorRole: answer.author.role,
        isAccepted: answer.isAccepted,
        createdAt: answer.createdAt,
      };

      broadcastAnswer(io, questionValidation.question!.sessionId, broadcastPayload);
    } catch (error) {
      console.error("[AnswerHandler] Failed to create answer:", error);
      socket.emit("answer:error", {
        message: "An error occurred while creating your answer.",
      });
    }
  });
}
