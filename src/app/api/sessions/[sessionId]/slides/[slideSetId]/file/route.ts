import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readFile } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ sessionId: string; slideSetId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/sessions/[sessionId]/slides/[slideSetId]/file
// ---------------------------------------------------------------------------

/**
 * Downloads/streams a PDF file for viewing.
 *
 * Returns the PDF file with appropriate headers for browser viewing.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId, slideSetId } = await params;

    // 1. Authenticate
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // 2. Single query: fetch slideSet + verify it belongs to the session +
    //    confirm the user is enrolled in the session's course.
    const slideSet = await prisma.slideSet.findUnique({
      where: { id: slideSetId },
      select: {
        storageKey: true,
        filename: true,
        session: {
          select: {
            id: true,
            course: {
              select: {
                enrollments: {
                  where: { userId: user.userId },
                  select: { role: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!slideSet) {
      return NextResponse.json({ error: "Slide set not found." }, { status: 404 });
    }

    if (slideSet.session.id !== sessionId) {
      return NextResponse.json(
        { error: "Slide set does not belong to this session." },
        { status: 404 }
      );
    }

    if (slideSet.session.course.enrollments.length === 0) {
      return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 });
    }

    // 3. Read and return the file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(slideSet.storageKey);
    } catch {
      console.error(`[Slides API] File not found in storage: ${slideSet.storageKey}`);
      return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
    }

    // Return the PDF with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(slideSet.filename)}"`,
        "Content-Length": fileBuffer.length.toString(),
        // Cache for 1 hour (slides don't change often)
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Slides API] Failed to retrieve file:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving the file." },
      { status: 500 }
    );
  }
}
