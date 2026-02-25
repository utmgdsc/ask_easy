import { prisma } from "@/lib/prisma";
import { generateSignedUrl } from "./signedUrl";

export async function getSlideSetsForSession(sessionId: string) {
  return prisma.slideSet.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSlideSetWithSignedUrl(sessionId: string, slideSetId: string) {
  const slideSet = await prisma.slideSet.findUnique({
    where: { id: slideSetId, sessionId },
    include: { slides: true },
  });

  if (!slideSet) {
    return null;
  }

  const { url, expiresAt } = generateSignedUrl(slideSet.storageUrl);

  return {
    ...slideSet,
    signedUrl: url,
    expiresAt,
  };
}
