-- Drop index on Question.slideId
DROP INDEX IF EXISTS "Question_slideId_idx";

-- Remove slideId column from Question
ALTER TABLE "Question" DROP COLUMN IF EXISTS "slideId";

-- Drop Slide table
DROP TABLE IF EXISTS "Slide";

-- Remove slides relation from SlideSet (no column to drop, relation was via Slide table)
