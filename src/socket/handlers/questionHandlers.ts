import { type Server, type Socket } from "socket.io";

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
