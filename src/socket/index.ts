import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

import { authMiddleware } from "./middleware/auth";
import {
  handleQuestionCreate,
  handleQuestionUpvote,
  handleQuestionResolve,
} from "./handlers/questionHandlers";
import { handleAnswerCreate } from "./handlers/answerHandlers";
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
  // Redis adapter — two dedicated clients (pub + sub)
  // -----------------------------------------------------------------------

  const pubClient = new Redis(REDIS_URL);
  const subClient = new Redis(REDIS_URL);

  // Wait for both clients to be ready before attaching the adapter
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      pubClient.on("ready", resolve);
      pubClient.on("error", reject);
    }),
    new Promise<void>((resolve, reject) => {
      subClient.on("ready", resolve);
      subClient.on("error", reject);
    }),
  ]);

  io.adapter(createAdapter(pubClient, subClient));
  console.log("[Socket.IO] Redis adapter connected");

  // Log ongoing Redis errors (non-fatal after initial connect)
  pubClient.on("error", (err) => console.error("[Socket.IO] Redis pub client error:", err.message));
  subClient.on("error", (err) => console.error("[Socket.IO] Redis sub client error:", err.message));

  // -----------------------------------------------------------------------
  // Authentication middleware
  // -----------------------------------------------------------------------

  io.use(authMiddleware);

  // -----------------------------------------------------------------------
  // Connection handler
  // -----------------------------------------------------------------------

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (user: ${socket.data.userId})`);

    // Session room management
    socket.on("session:join", (payload) => {
      if (payload?.sessionId && typeof payload.sessionId === "string") {
        socket.join(`session:${payload.sessionId}`);
        console.log(`[Socket.IO] ${socket.id} joined session:${payload.sessionId}`);
      }
    });

    socket.on("session:leave", (payload) => {
      if (payload?.sessionId && typeof payload.sessionId === "string") {
        socket.leave(`session:${payload.sessionId}`);
        console.log(`[Socket.IO] ${socket.id} left session:${payload.sessionId}`);
      }
    });

    // Register per-socket event handlers
    handleQuestionCreate(socket, io!);
    handleQuestionUpvote(socket, io!);
    handleQuestionResolve(socket, io!);
    handleAnswerCreate(socket, io!);

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  // -----------------------------------------------------------------------
  // Graceful shutdown — close adapter Redis clients
  // -----------------------------------------------------------------------

  const shutdown = async () => {
    console.log("[Socket.IO] Shutting down Redis adapter clients…");
    await Promise.all([pubClient.quit().catch(() => {}), subClient.quit().catch(() => {})]);
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
