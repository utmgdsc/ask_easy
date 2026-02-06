import type { Socket } from "socket.io";

import type { SocketData } from "../types";

// ---------------------------------------------------------------------------
// Socket.IO authentication middleware (PLACEHOLDER until shibboleth)
// ---------------------------------------------------------------------------
//
// TODO: Replace this stub with real authentication once NextAuth.js (or
//       another auth provider) is integrated. The real implementation should:
//
//   1. Read a JWT / session token from `socket.handshake.auth.token`.
//   2. Verify it against the auth provider (e.g. NextAuth `getToken()`).
//   3. Look up the user in the database if needed.
//   4. Populate `socket.data.userId` (and any other user fields).
//   5. Call `next()` on success or `next(new Error(...))` on failure.
//
// The current stub accepts any connection that provides a `userId` string in
// the handshake auth object.  This is **NOT** secure and is intended only for
// development / integration testing while auth is not yet available.
// ---------------------------------------------------------------------------

/**
 * Authenticate an incoming Socket.IO connection.
 *
 * Expects `socket.handshake.auth.userId` to be a non-empty string.
 * Rejects the connection otherwise.
 */
export function authMiddleware(
  socket: Socket<never, never, never, SocketData>,
  next: (err?: Error) => void
): void {
  // TODO: Replace with real token validation
  // const token = socket.handshake.auth?.token;
  const userId = socket.handshake.auth?.userId as string | undefined;

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return next(new Error("Authentication required. Provide userId in handshake auth."));
  }

  // Attach user data to the socket for downstream handlers
  socket.data.userId = userId;
  socket.data.connectedAt = new Date();

  next();
}
