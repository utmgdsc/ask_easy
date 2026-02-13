import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * GET /api/sessions
 *
 * Returns active sessions with course info.
 */
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        joinCode: true,
        status: true,
        course: { select: { code: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Sessions API] Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching sessions." },
      { status: 500 }
    );
  }
}
