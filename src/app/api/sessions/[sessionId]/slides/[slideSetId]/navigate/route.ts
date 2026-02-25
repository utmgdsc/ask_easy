import { NextRequest, NextResponse } from "next/server";
import { updateSessionCurrentSlide } from "@/lib/slideNavigation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; slideSetId: string }> }
) {
  try {
    const { sessionId, slideSetId } = await params;
    const body = await request.json();
    const { slideId } = body;

    // Simulate Auth Check (Assuming Professor)
    // TODO: Verify Professor Role here

    if (!slideId) {
      return NextResponse.json({ error: "slideId is required" }, { status: 400 });
    }

    const result = await updateSessionCurrentSlide(sessionId, slideSetId, slideId);

    if (!result.valid || !result.slide) {
      return NextResponse.json({ error: result.error || "Slide not found" }, { status: 400 });
    }

    // Emit Socket.IO event
    try {
      const { getIO } = await import("@/socket");
      const { broadcastSlideChange } = await import("@/socket/handlers/slideHandlers");
      const io = getIO();
      broadcastSlideChange(io, sessionId, {
        slideSetId,
        slideId,
        pageNumber: result.slide.pageNumber,
      });
    } catch (err) {
      console.warn("[Slides Navigate API] Could not broadcast socket event:", err);
    }

    return NextResponse.json({ success: true, slide: result.slide });
  } catch (error) {
    console.error("[Slides Navigate API] Failed to navigate slides:", error);
    return NextResponse.json(
      { error: "An error occurred while navigating slides." },
      { status: 500 }
    );
  }
}
