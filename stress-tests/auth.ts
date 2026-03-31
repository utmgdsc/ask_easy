/**
 * Auth Helper for Stress Tests
 *
 * Mints valid iron-session cookies for each test user without going through HTTP.
 * Uses the same sealData function that iron-session uses internally.
 */
import { sealData } from "iron-session";

interface StressUser {
  id: string;
  utorid: string;
}

interface SessionData {
  userId: string;
  utorid: string;
  name: string;
  email: string;
  role: string;
}

const COOKIE_NAME = "ask_easy_session";

export async function mintCookie(user: StressUser, role: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET env var is required");
  }

  const sessionData: SessionData = {
    userId: user.id,
    utorid: user.utorid,
    name: user.utorid.replace(/_/g, " "),
    email: `${user.utorid}@mail.utoronto.ca`,
    role,
  };

  const sealed = await sealData(sessionData, { password: secret });
  return `${COOKIE_NAME}=${sealed}`;
}

export async function mintAllCookies(
  students: StressUser[],
  professor: StressUser
): Promise<{ studentCookies: string[]; professorCookie: string }> {
  const [professorCookie, ...studentCookies] = await Promise.all([
    mintCookie(professor, "PROFESSOR"),
    ...students.map((s) => mintCookie(s, "STUDENT")),
  ]);

  return { studentCookies, professorCookie };
}
