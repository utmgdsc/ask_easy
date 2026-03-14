import type { SessionOptions } from "iron-session";

// ---------------------------------------------------------------------------
// Session data shape stored inside the encrypted cookie
// ---------------------------------------------------------------------------

export interface SessionData {
  userId: string;
  utorid: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// iron-session configuration (lazy so build can run without SESSION_SECRET)
// ---------------------------------------------------------------------------

export function getSessionOptions(): SessionOptions {
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is not set. Generate one with: openssl rand -hex 32"
    );
  }
  return {
    password: process.env.SESSION_SECRET,
    cookieName: "ask_easy_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}
