import { Server, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";

export function broadcastSlideChange(
  io: Server,
  sessionId: string,
  slideData: { slideSetId: string; slideId: string; pageNumber: number }
) {
  io.to(`session:${sessionId}`).emit("slide_changed", slideData);
}

export async function sendCurrentStateToUser(socket: Socket, sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        currentSlide: true,
      },
    });

    if (session?.currentSlideSetId && session?.currentSlideId && session.currentSlide) {
      socket.emit("current_state", {
        slideSetId: session.currentSlideSetId,
        slideId: session.currentSlideId,
        pageNumber: session.currentSlide.pageNumber,
      });
    }
  } catch (error) {
    console.error("[Socket Slide Handler] Failed to send current state:", error);
  }
}
