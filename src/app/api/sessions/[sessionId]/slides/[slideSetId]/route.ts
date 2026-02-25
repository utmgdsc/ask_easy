import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSlideSetWithSignedUrl } from "@/lib/slideRetrieval";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; slideSetId: string }> }
) {
  try {
    const { sessionId, slideSetId } = await params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 403 });
    }

    const slideSet = await getSlideSetWithSignedUrl(sessionId, slideSetId);

    if (!slideSet) {
      return NextResponse.json({ error: "Slide set not found." }, { status: 404 });
    }

    return NextResponse.json({ slideSet });
  } catch (error) {
    console.error("[Slides API] Failed to fetch slide set details:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the slide set." },
      { status: 500 }
    );
  }
}
