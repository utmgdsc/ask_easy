import { type Server, type Socket } from "socket.io";

import { prisma } from "@/lib/prisma";
import { redisCache } from "@/lib/redis";
import { answerMode as answerModeKey } from "@/lib/redisKeys";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANSWER_MODE_TTL_SECONDS = 86400; // 24 hours

type AnswerMode = "all" | "instructors_only";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerModeChangePayload {
  sessionId: string;
  mode: AnswerMode;
}

interface AnswerModeSyncPayload {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Registers the `answer-mode:change` event listener on the given socket.
 *
 * Only professors may change the answer mode for a session.
 *
 * Guard order:
 *   1. Auth          — socket.data.userId must exist
 *   2. Payload shape — sessionId string, mode must be "all" or "instructors_only"
 *   3. Role check    — user must have role === "PROFESSOR" (DB lookup)
 *   4. Session check — session must exist in the DB
 *   5. Persist       — mode written to Redis (24 h TTL)
 *   6. Broadcast     — emit answer-mode:changed to session:{sessionId}
 */
export function handleAnswerModeChange(socket: Socket, io: Server): void {
  socket.on("answer-mode:change", async (payload: AnswerModeChangePayload) => {
    try {
      // 1. Auth guard
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        return;
      }

      // 2. Payload shape guard
      if (!payload || typeof payload !== "object") return;

      const { sessionId, mode } = payload;

      if (!sessionId || typeof sessionId !== "string") return;
      if (mode !== "all" && mode !== "instructors_only") return;

      // 3. Role check — only professors may change the answer mode
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== "PROFESSOR") return;

      // 4. Session existence check
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true },
      });

      if (!session) return;

      // 5. Persist to Redis
      await redisCache.set(answerModeKey(sessionId), mode, "EX", ANSWER_MODE_TTL_SECONDS);

      // 6. Broadcast to all participants
      io.to(`session:${sessionId}`).emit("answer-mode:changed", { mode });
    } catch (error) {
      console.error("[SessionHandler] Failed to process answer-mode:change:", error);
    }
  });
}

/**
 * Registers the `answer-mode:sync` event listener on the given socket.
 *
 * Returns the current answer mode for the session so late joiners
 * get the correct state immediately.
 *
 * Guard order:
 *   1. Auth          — socket.data.userId must exist
 *   2. Payload shape — sessionId string
 *   3. Redis lookup  — read persisted mode (defaults to "all" if not set)
 *   4. Reply         — emit answer-mode:changed back to the requesting socket only
 */
export function handleAnswerModeSync(socket: Socket): void {
  socket.on("answer-mode:sync", async (payload: AnswerModeSyncPayload) => {
    try {
      // 1. Auth guard
      const userId: string | undefined = socket.data?.userId;
      if (!userId) return;

      // 2. Payload shape guard
      if (!payload || typeof payload !== "object") return;

      const { sessionId } = payload;
      if (!sessionId || typeof sessionId !== "string") return;

      // 3. Read current mode from Redis (default to "all")
      const stored = await redisCache.get(answerModeKey(sessionId));
      const mode: AnswerMode =
        stored === "all" || stored === "instructors_only" ? stored : "all";

      // 4. Reply to requesting socket only
      socket.emit("answer-mode:changed", { mode });
    } catch (error) {
      console.error("[SessionHandler] Failed to process answer-mode:sync:", error);
    }
  });
}
