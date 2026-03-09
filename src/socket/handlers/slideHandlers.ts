import { type Server, type Socket } from "socket.io";

import { prisma } from "@/lib/prisma";
import { redisCache } from "@/lib/redis";
import { slideState } from "@/lib/redisKeys";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIDE_STATE_TTL_SECONDS = 86400; // 24 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlideChangePayload {
  sessionId: string;
  pageIndex: number;
}

interface SlideSyncPayload {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Registers the `slide:change` event listener on the given socket.
 *
 * Only professors may change the shared slide position for a session.
 *
 * Guard order (cheap-before-expensive):
 *   1. Auth          — socket.data.userId must exist
 *   2. Payload shape — sessionId must be a string, pageIndex a non-negative integer
 *   3. Role check    — user must have role === "PROFESSOR" (DB lookup)
 *   4. Session check — session must exist in the DB
 *   5. Persist       — current page index written to Redis (24 h TTL)
 *   6. Broadcast     — emit slide:changed to session:{sessionId} (all participants)
 */
export function handleSlideChange(socket: Socket, io: Server): void {
  socket.on("slide:change", async (payload: SlideChangePayload) => {
    try {
      // 1. Auth guard
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        socket.emit("slide:error", { message: "Authentication required." });
        return;
      }

      // 2. Payload shape guard
      if (!payload || typeof payload !== "object") {
        socket.emit("slide:error", { message: "Invalid request." });
        return;
      }

      const { sessionId, pageIndex } = payload;

      if (!sessionId || typeof sessionId !== "string") {
        socket.emit("slide:error", { message: "Session ID is required." });
        return;
      }

      if (
        typeof pageIndex !== "number" ||
        !Number.isInteger(pageIndex) ||
        pageIndex < 0
      ) {
        socket.emit("slide:error", {
          message: "pageIndex must be a non-negative integer.",
        });
        return;
      }

      // 3. Role check — only professors may broadcast slide changes
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        socket.emit("slide:error", { message: "User not found." });
        return;
      }

      if (user.role !== "PROFESSOR") {
        socket.emit("slide:error", {
          message: "Only professors can change the shared slide position.",
        });
        return;
      }

      // 4. Session existence check
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true },
      });

      if (!session) {
        socket.emit("slide:error", { message: "Session not found." });
        return;
      }

      // 5. Persist current page to Redis with a 24-hour TTL
      await redisCache.set(slideState(sessionId), pageIndex, "EX", SLIDE_STATE_TTL_SECONDS);

      // 6. Broadcast to all participants in the session room
      io.to(`session:${sessionId}`).emit("slide:changed", { pageIndex });
    } catch (error) {
      console.error("[SlideHandler] Failed to process slide:change:", error);
      socket.emit("slide:error", {
        message: "An error occurred while updating the slide position.",
      });
    }
  });
}

/**
 * Registers the `slide:sync` event listener on the given socket.
 *
 * Returns the professor's last known page index for the session so that
 * late joiners or reconnecting clients can jump to the correct slide.
 *
 * Guard order:
 *   1. Auth          — socket.data.userId must exist
 *   2. Payload shape — sessionId must be a string
 *   3. Redis lookup  — read persisted page index (defaults to 0 if not set)
 *   4. Reply         — emit slide:sync back to the requesting socket only
 */
export function handleSlideSync(socket: Socket): void {
  socket.on("slide:sync", async (payload: SlideSyncPayload) => {
    try {
      // 1. Auth guard
      const userId: string | undefined = socket.data?.userId;
      if (!userId) {
        socket.emit("slide:error", { message: "Authentication required." });
        return;
      }

      // 2. Payload shape guard
      if (!payload || typeof payload !== "object") {
        socket.emit("slide:error", { message: "Invalid request." });
        return;
      }

      const { sessionId } = payload;

      if (!sessionId || typeof sessionId !== "string") {
        socket.emit("slide:error", { message: "Session ID is required." });
        return;
      }

      // 3. Read current page index from Redis
      const stored = await redisCache.get(slideState(sessionId));
      const pageIndex = stored !== null ? parseInt(stored, 10) : 0;

      // 4. Reply only to the requesting socket
      socket.emit("slide:sync", { pageIndex });
    } catch (error) {
      console.error("[SlideHandler] Failed to process slide:sync:", error);
      socket.emit("slide:error", {
        message: "An error occurred while syncing the slide position.",
      });
    }
  });
}
