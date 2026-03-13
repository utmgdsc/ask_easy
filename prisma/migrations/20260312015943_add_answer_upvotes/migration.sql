-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AnswerUpvote" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AnswerUpvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnswerUpvote_answerId_idx" ON "AnswerUpvote"("answerId");

-- CreateIndex
CREATE INDEX "AnswerUpvote_userId_idx" ON "AnswerUpvote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerUpvote_answerId_userId_key" ON "AnswerUpvote"("answerId", "userId");

-- AddForeignKey
ALTER TABLE "AnswerUpvote" ADD CONSTRAINT "AnswerUpvote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerUpvote" ADD CONSTRAINT "AnswerUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
