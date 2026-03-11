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
// iron-session configuration
// ---------------------------------------------------------------------------

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is not set. " + "Generate one with: openssl rand -hex 32"
  );
}

export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "ask_easy_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    // 7-day session lifetime
    maxAge: 60 * 60 * 24 * 7,
  },
};
