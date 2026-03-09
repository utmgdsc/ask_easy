/**
 * Prints a valid sessionId and userId for testing the questions API.
 * The user is enrolled in the session's course.
 *
 * Run: pnpm run scripts:get-test-ids
 * Or:  npx tsx scripts/get-test-ids.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  const session = await prisma.session.findFirst({
    select: { id: true, title: true, courseId: true },
  });

  if (!session) {
    console.log("No sessions in the database. Run db:seed or create a session first.");
    process.exit(1);
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { courseId: session.courseId },
    select: { userId: true, role: true, user: { select: { name: true } } },
  });

  if (!enrollment) {
    console.log("No users enrolled in this session's course. Run db:seed or add an enrollment.");
    process.exit(1);
  }

  console.log("\nUse these for testing GET /api/sessions/[sessionId]/questions:\n");
  console.log("  SESSION_ID:", session.id);
  console.log("  USER_ID:   ", enrollment.userId);
  console.log("\nExample:");
  console.log(
    `  curl "http://localhost:3000/api/sessions/${session.id}/questions?limit=5" -H "x-user-id: ${enrollment.userId}"`
  );
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
