/*
  Warnings:

  - Added the required column `sessionId` to the `Slide` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageUrl` to the `SlideSet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "currentSlideId" TEXT,
ADD COLUMN     "currentSlideSetId" TEXT;

-- AlterTable
ALTER TABLE "Slide" ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SlideSet" ADD COLUMN     "storageUrl" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Session_currentSlideSetId_idx" ON "Session"("currentSlideSetId");

-- CreateIndex
CREATE INDEX "Session_currentSlideId_idx" ON "Session"("currentSlideId");

-- CreateIndex
CREATE INDEX "Slide_sessionId_idx" ON "Slide"("sessionId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_currentSlideSetId_fkey" FOREIGN KEY ("currentSlideSetId") REFERENCES "SlideSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_currentSlideId_fkey" FOREIGN KEY ("currentSlideId") REFERENCES "Slide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
