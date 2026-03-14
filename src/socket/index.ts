import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

import { authMiddleware } from "./middleware/auth";
import {
  handleQuestionCreate,
  handleQuestionUpvote,
  handleQuestionResolve,
  handleQuestionDelete,
} from "./handlers/questionHandlers";
import {
  handleAnswerCreate,
  handleAnswerUpvote,
  handleAnswerDelete,
} from "./handlers/answerHandlers";
import { handleSlideChange, handleSlideSync, handleSlidesUploaded } from "./handlers/slideHandlers";
import { handleAnswerModeChange, handleAnswerModeSync } from "./handlers/sessionHandlers";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Create and attach a Socket.IO server to the given HTTP server.
 *
 * - Configures the Redis adapter for horizontal scaling.
 * - Registers the authentication middleware.
 * - Wires up connection / disconnection logging and event handlers.
 *
 * Returns the fully initialised `io` instance.
 */
export async function initSocketIO(
  httpServer: HttpServer
): Promise<
  SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
> {
  const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : "*",
    },
    connectionStateRecovery: {},
  });

  // -----------------------------------------------------------------------
  // Redis adapter — two dedicated clients (pub + sub). Optional in dev.
  // -----------------------------------------------------------------------

  const useRedisAdapter = process.env.SOCKET_IO_USE_REDIS !== "false";
  let pubClient: Redis | null = null;
  let subClient: Redis | null = null;

  if (useRedisAdapter) {
    try {
      pubClient = new Redis(REDIS_URL);
      subClient = new Redis(REDIS_URL);

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          pubClient!.on("ready", resolve);
          pubClient!.on("error", reject);
        }),
        new Promise<void>((resolve, reject) => {
          subClient!.on("ready", resolve);
          subClient!.on("error", reject);
        }),
      ]);

      io.adapter(createAdapter(pubClient!, subClient!));
      console.log("[Socket.IO] Redis adapter connected");

      pubClient.on("error", (err) =>
        console.error("[Socket.IO] Redis pub client error:", err.message)
      );
      subClient.on("error", (err) =>
        console.error("[Socket.IO] Redis sub client error:", err.message)
      );
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[Socket.IO] Redis unavailable, running without adapter (single-instance only):",
          err instanceof Error ? err.message : err
        );
        pubClient?.quit().catch(() => {});
        subClient?.quit().catch(() => {});
        pubClient = null;
        subClient = null;
      } else {
        throw err;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Authentication middleware
  // -----------------------------------------------------------------------

  io.use(authMiddleware);

  // -----------------------------------------------------------------------
  // Connection handler
  // -----------------------------------------------------------------------

  async function broadcastViewerCount(sessionId: string) {
    const sockets = await io!.in(`session:${sessionId}`).fetchSockets();
    const count = sockets.filter((s) => s.data.role !== "PROFESSOR").length;
    io!.to(`session:${sessionId}`).emit("viewer:count", { count });
  }

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (user: ${socket.data.userId})`);

    // Session room management
    socket.on("session:join", async (payload) => {
      if (payload?.sessionId && typeof payload.sessionId === "string") {
        if (socket.data.currentSessionId && socket.data.currentSessionId !== payload.sessionId) {
          socket.leave(`session:${socket.data.currentSessionId}`);
          await broadcastViewerCount(socket.data.currentSessionId);
        }

        socket.join(`session:${payload.sessionId}`);
        socket.data.currentSessionId = payload.sessionId;
        console.log(`[Socket.IO] ${socket.id} joined session:${payload.sessionId}`);

        await broadcastViewerCount(payload.sessionId);
      }
    });

    socket.on("viewer:sync", async (payload) => {
      if (payload?.sessionId && typeof payload.sessionId === "string") {
        const sockets = await io!.in(`session:${payload.sessionId}`).fetchSockets();
        const count = sockets.filter((s) => s.data.role !== "PROFESSOR").length;
        socket.emit("viewer:count", { count });
      }
    });

    socket.on("session:leave", async (payload) => {
      if (payload?.sessionId && typeof payload.sessionId === "string") {
        socket.leave(`session:${payload.sessionId}`);
        if (socket.data.currentSessionId === payload.sessionId) {
          socket.data.currentSessionId = undefined;
        }
        console.log(`[Socket.IO] ${socket.id} left session:${payload.sessionId}`);

        await broadcastViewerCount(payload.sessionId);
      }
    });

    // Register per-socket event handlers
    handleQuestionCreate(socket, io!);
    handleQuestionUpvote(socket, io!);
    handleQuestionResolve(socket, io!);
    handleQuestionDelete(socket, io!);
    handleAnswerCreate(socket, io!);
    handleAnswerUpvote(socket, io!);
    handleAnswerDelete(socket, io!);
    handleSlideChange(socket, io!);
    handleSlideSync(socket);
    handleSlidesUploaded(socket, io!);
    handleAnswerModeChange(socket, io!);
    handleAnswerModeSync(socket);

    socket.on("disconnect", async (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (reason: ${reason})`);
      const sessionId = socket.data.currentSessionId;
      if (sessionId) {
        await broadcastViewerCount(sessionId);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Graceful shutdown — close adapter Redis clients
  // -----------------------------------------------------------------------

  const shutdown = async () => {
    if (pubClient || subClient) {
      console.log("[Socket.IO] Shutting down Redis adapter clients…");
      await Promise.all([pubClient?.quit().catch(() => {}), subClient?.quit().catch(() => {})]);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return io;
}

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/**
 * Return the Socket.IO server singleton.
 *
 * Throws if called before `initSocketIO()`.
 */
export function getIO(): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error("Socket.IO has not been initialised. Call initSocketIO() first.");
  }
  return io;
}
