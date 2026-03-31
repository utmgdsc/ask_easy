/**
 * Scenario: Question Flood
 *
 * All 100 students post a question at the same time via the REST API.
 * Tests database write throughput and contention under concurrent inserts.
 */
import { mintCookie } from "../auth";
import { BASE_URL, summarize, type ScenarioResult, type StressFixtures } from "../utils";

export async function runQuestionFlood(fixtures: StressFixtures): Promise<ScenarioResult> {
  const cookies = await Promise.all(fixtures.students.map((s) => mintCookie(s, "STUDENT")));

  const latencies: number[] = [];
  const errors: Record<string, number> = {};

  const start = Date.now();

  const promises = fixtures.students.map(async (student, i) => {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/sessions/${fixtures.sessionId}/questions`, {
        method: "POST",
        headers: {
          cookie: cookies[i],
          "content-type": "application/json",
        },
        body: JSON.stringify({
          content: `Stress test question from student ${i}: What is the answer to question ${i}?`,
          visibility: "PUBLIC",
          isAnonymous: false,
        }),
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

  return summarize("Question Flood (100 concurrent)", latencies, errors, duration);
}
