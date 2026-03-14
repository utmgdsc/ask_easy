import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { performSessionEnd, SESSION_INACTIVITY_MS } from "@/lib/sessionService";

/**
 * GET /api/cron/cleanup-sessions
 *
 * Finds all ACTIVE sessions whose lastActivityAt is older than the inactivity
 * threshold and ends each one. Intended to be called on a regular schedule
 * (e.g. every 15 minutes) by an external cron service or Vercel Cron Jobs so
 * that stale sessions are cleaned up even when no clients are polling.
 *
 * Requires CRON_SECRET to be set in the environment. Pass it as a Bearer token:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured.");
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - SESSION_INACTIVITY_MS);

    const staleSessions = await prisma.session.findMany({
      where: {
        status: "ACTIVE",
        lastActivityAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (staleSessions.length === 0) {
      return NextResponse.json({ ended: 0 });
    }

    const results = await Promise.allSettled(staleSessions.map((s) => performSessionEnd(s.id)));

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      console.error(`[Cron] cleanup-sessions: ${failed} session(s) failed to end.`);
    }

    return NextResponse.json({ ended: succeeded, failed });
  } catch (error) {
    console.error("[Cron] cleanup-sessions failed:", error);
    return NextResponse.json({ error: "An error occurred during cleanup." }, { status: 500 });
  }
}
