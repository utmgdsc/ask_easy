/**
 * Shared utilities for stress test scenarios
 */

export interface StressFixtures {
  professorId: string;
  professorUtorid: string;
  courseId: string;
  sessionId: string;
  joinCode: string;
  studentCount: number;
  students: { id: string; utorid: string }[];
}

export interface ScenarioResult {
  name: string;
  totalRequests: number;
  successful: number;
  failed: number;
  errors: Record<string, number>;
  durationMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  rps: number;
}

/** Calculate percentile from sorted array of numbers */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/** Summarize latency array into a ScenarioResult */
export function summarize(
  name: string,
  latencies: number[],
  errors: Record<string, number>,
  durationMs: number
): ScenarioResult {
  const sorted = [...latencies].sort((a, b) => a - b);
  const successful = latencies.length;
  const failed = Object.values(errors).reduce((a, b) => a + b, 0);
  const total = successful + failed;

  return {
    name,
    totalRequests: total,
    successful,
    failed,
    errors,
    durationMs,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    avgMs: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
    rps: total > 0 ? total / (durationMs / 1000) : 0,
  };
}

/** Pretty-print a scenario result */
export function printResult(r: ScenarioResult): void {
  console.log(`\n--- ${r.name} ---`);
  console.log(`  Total:      ${r.totalRequests} requests in ${(r.durationMs / 1000).toFixed(1)}s`);
  console.log(`  Successful: ${r.successful}`);
  console.log(`  Failed:     ${r.failed}`);
  if (Object.keys(r.errors).length > 0) {
    console.log(`  Errors:     ${JSON.stringify(r.errors)}`);
  }
  console.log(
    `  Latency:    avg=${r.avgMs.toFixed(0)}ms  p50=${r.p50Ms}ms  p95=${r.p95Ms}ms  p99=${r.p99Ms}ms`
  );
  console.log(`  Throughput: ${r.rps.toFixed(1)} req/s`);
}

/** Run a function for each item with concurrency control */
export async function runConcurrent<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

export const BASE_URL = process.env.STRESS_BASE_URL || "http://localhost:3000";
