import { prisma } from "@/lib/prisma";
import type { Slide } from "@/generated/prisma";

export interface NavigationResult {
  valid: boolean;
  error?: string;
  slide?: Slide;
}

export async function updateSessionCurrentSlide(
  sessionId: string,
  slideSetId: string,
  slideId: string
): Promise<NavigationResult> {
  // Validate slideId belongs to slideSetId and sessionId
  const slide = await prisma.slide.findUnique({
    where: { id: slideId },
  });

  if (!slide || slide.slideSetId !== slideSetId || slide.sessionId !== sessionId) {
    return { valid: false, error: "Slide does not belong to the specified slide set." };
  }

  // Update session
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      currentSlideSetId: slideSetId,
      currentSlideId: slideId,
    },
  });

  return { valid: true, slide };
}
