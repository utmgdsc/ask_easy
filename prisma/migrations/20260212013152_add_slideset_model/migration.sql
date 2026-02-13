/*
  Warnings:

  - You are about to drop the column `contentUrl` on the `Slide` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `Slide` table. All the data in the column will be lost.
  - You are about to drop the column `slideNumber` on the `Slide` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slideSetId,pageNumber]` on the table `Slide` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pageNumber` to the `Slide` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slideSetId` to the `Slide` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Slide" DROP CONSTRAINT "Slide_sessionId_fkey";

-- DropIndex
DROP INDEX "Slide_sessionId_idx";

-- AlterTable
ALTER TABLE "Slide" DROP COLUMN "contentUrl",
DROP COLUMN "sessionId",
DROP COLUMN "slideNumber",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pageNumber" INTEGER NOT NULL,
ADD COLUMN     "slideSetId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SlideSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlideSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlideSet_sessionId_idx" ON "SlideSet"("sessionId");

-- CreateIndex
CREATE INDEX "SlideSet_uploadedBy_idx" ON "SlideSet"("uploadedBy");

-- CreateIndex
CREATE INDEX "Slide_slideSetId_idx" ON "Slide"("slideSetId");

-- CreateIndex
CREATE UNIQUE INDEX "Slide_slideSetId_pageNumber_key" ON "Slide"("slideSetId", "pageNumber");

-- AddForeignKey
ALTER TABLE "SlideSet" ADD CONSTRAINT "SlideSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideSet" ADD CONSTRAINT "SlideSet_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_slideSetId_fkey" FOREIGN KEY ("slideSetId") REFERENCES "SlideSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
