import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * GET /api/users
 *
 * Returns all users. Used for testing user selection
 * while authentication is not yet implemented.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        utorid: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Users API] Failed to fetch users:", error);
    return NextResponse.json({ error: "An error occurred while fetching users." }, { status: 500 });
  }
}
