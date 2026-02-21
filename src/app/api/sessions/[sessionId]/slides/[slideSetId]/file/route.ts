import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readFile, fileExists } from "@/lib/storage";

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
 *
 * Validations:
 *   1. Session exists
 *   2. SlideSet exists and belongs to the session
 *   3. File exists in storage
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId, slideSetId } = await params;

    // TODO: Add in real authentication once UofT auth is added

    // 1. Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // 2. Validate SlideSet exists and belongs to this session
    const slideSet = await prisma.slideSet.findUnique({
      where: { id: slideSetId },
    });

    if (!slideSet) {
      return NextResponse.json({ error: "Slide set not found." }, { status: 404 });
    }

    if (slideSet.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Slide set does not belong to this session." },
        { status: 404 }
      );
    }

    // 3. Check if file exists in storage
    const exists = await fileExists(slideSet.storageKey);
    if (!exists) {
      console.error(`[Slides API] File not found in storage: ${slideSet.storageKey}`);
      return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
    }

    // 4. Read and return the file
    const fileBuffer = await readFile(slideSet.storageKey);

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
