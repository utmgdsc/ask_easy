/**
 * Scenario: Session Join Storm
 *
 * Simulates 100 students joining a session simultaneously via the REST API.
 * Uses a fresh session (students NOT pre-enrolled for this scenario).
 */
import { PrismaClient, SessionStatus } from "../../src/generated/prisma";
import { mintCookie } from "../auth";
import { BASE_URL, summarize, type ScenarioResult, type StressFixtures } from "../utils";

const prisma = new PrismaClient();

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function runSessionJoinStorm(fixtures: StressFixtures): Promise<ScenarioResult> {
  // Create a separate session for the join test (students must NOT be pre-enrolled)
  // First, unenroll students from the stress course so they can join fresh
  const joinSession = await prisma.session.create({
    data: {
      courseId: fixtures.courseId,
      createdById: fixtures.professorId,
      title: "Join Storm Session",
      joinCode: generateJoinCode(),
      status: SessionStatus.ACTIVE,
      isSubmissionsEnabled: true,
    },
  });

  // Remove student enrollments so they can re-join
  await prisma.courseEnrollment.deleteMany({
    where: {
      courseId: fixtures.courseId,
      role: "STUDENT",
    },
  });

  // Mint cookies for all students
  const cookies = await Promise.all(fixtures.students.map((s) => mintCookie(s, "STUDENT")));

  const latencies: number[] = [];
  const errors: Record<string, number> = {};

  const start = Date.now();

  // Fire all 100 join requests concurrently
  const promises = fixtures.students.map(async (student, i) => {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/sessions/join/${joinSession.joinCode}`, {
        method: "POST",
        headers: {
          cookie: cookies[i],
          "content-type": "application/json",
        },
      });

      const elapsed = Date.now() - t0;

      if (res.ok) {
        latencies.push(elapsed);
      } else {
        const body = await res.json().catch(() => ({}));
        const key = `${res.status}: ${body.error || "unknown"}`;
        errors[key] = (errors[key] || 0) + 1;
      }
    } catch (err) {
      const key = `network: ${(err as Error).message}`;
      errors[key] = (errors[key] || 0) + 1;
    }
  });

  await Promise.all(promises);
  const duration = Date.now() - start;

  // Cleanup: re-enroll students for other scenarios
  const enrolled = await prisma.courseEnrollment.findMany({
    where: { courseId: fixtures.courseId, role: "STUDENT" },
    select: { userId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.userId));
  const unenrolled = fixtures.students.filter((s) => !enrolledIds.has(s.id));

  if (unenrolled.length > 0) {
    await prisma.courseEnrollment.createMany({
      data: unenrolled.map((s) => ({
        userId: s.id,
        courseId: fixtures.courseId,
        role: "STUDENT" as const,
      })),
    });
  }

  // Cleanup the join storm session
  await prisma.session.delete({ where: { id: joinSession.id } });

  await prisma.$disconnect();

  return summarize("Session Join Storm (100 concurrent)", latencies, errors, duration);
}
