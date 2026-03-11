import { unsealData } from "iron-session";
import type { Socket } from "socket.io";

import { SESSION_OPTIONS, type SessionData } from "@/lib/session";
import type { SocketData } from "../types";

// ---------------------------------------------------------------------------
// Socket.IO authentication middleware
//
// Validates the iron-session cookie that was issued by /api/auth/session
// (after Shibboleth SSO). The browser sends the cookie automatically on the
// WebSocket upgrade request because the Socket.IO client is initialised with
// `withCredentials: true`.
//
// Flow:
//   1. Parse the `cookie` header from the Socket.IO handshake.
//   2. Find the `ask_easy_session` cookie value.
//   3. Unseal it with iron-session to recover { userId, utorid, role, … }.
//   4. Populate socket.data and call next().
// ---------------------------------------------------------------------------

/**
 * Parses a raw `Cookie` header string into a key→value map.
 * e.g. "a=1; b=2" → { a: "1", b: "2" }
 */
function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key.trim(), decodeURIComponent(rest.join("=").trim())];
    })
  );
}

export async function authMiddleware(
  socket: Socket<never, never, never, SocketData>,
  next: (err?: Error) => void
): Promise<void> {
  const cookieHeader = socket.handshake.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const sealedSession = cookies[SESSION_OPTIONS.cookieName as string];

  if (!sealedSession) {
    return next(new Error("Authentication required. No session cookie found."));
  }

  try {
    const session = await unsealData<SessionData>(sealedSession, {
      password: SESSION_OPTIONS.password as string,
    });

    if (!session?.userId) {
      return next(new Error("Authentication required. Invalid session."));
    }

    socket.data.userId = session.userId;
    socket.data.connectedAt = new Date();

    next();
  } catch {
    next(new Error("Authentication required. Session could not be verified."));
  }
}
