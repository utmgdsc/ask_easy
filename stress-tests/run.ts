#!/usr/bin/env tsx
/**
 * Stress Test Runner
 *
 * Orchestrates all stress test scenarios against a running dev server.
 *
 * Usage:
 *   1. Start the dev server:  pnpm dev
 *   2. Seed test data:        pnpm stress:seed
 *   3. Run all scenarios:     pnpm stress:run
 *   4. Run specific scenario: pnpm stress:run -- --only session-join
 *
 * Environment:
 *   STRESS_BASE_URL  - Server URL (default: http://localhost:3000)
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

import { runSessionJoinStorm } from "./scenarios/session-join";
import { runQuestionFlood } from "./scenarios/question-flood";
import { runUpvoteSurge } from "./scenarios/upvote-surge";
import { runSocketFanout } from "./scenarios/socket-fanout";
import { runMixedLoad } from "./scenarios/mixed-load";
import { printResult, type ScenarioResult, type StressFixtures } from "./utils";

// ---------------------------------------------------------------------------
// Load fixtures
// ---------------------------------------------------------------------------

const fixturesPath = path.join(__dirname, "fixtures.json");
if (!fs.existsSync(fixturesPath)) {
  console.error("ERROR: fixtures.json not found. Run `pnpm stress:seed` first.");
  process.exit(1);
}

const fixtures: StressFixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

// ---------------------------------------------------------------------------
// Scenario registry
// ---------------------------------------------------------------------------

const scenarios: Record<string, (f: StressFixtures) => Promise<ScenarioResult>> = {
  "session-join": runSessionJoinStorm,
  "question-flood": runQuestionFlood,
  "upvote-surge": runUpvoteSurge,
  "socket-fanout": runSocketFanout,
  "mixed-load": runMixedLoad,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  const toRun = only ? { [only]: scenarios[only] } : scenarios;

  if (only && !scenarios[only]) {
    console.error(`Unknown scenario: ${only}`);
    console.error(`Available: ${Object.keys(scenarios).join(", ")}`);
    process.exit(1);
  }

  const baseUrl = process.env.STRESS_BASE_URL || "http://localhost:3000";

  console.log("=== ask_easy Stress Tests ===");
  console.log(`  Server:   ${baseUrl}`);
  console.log(`  Students: ${fixtures.studentCount}`);
  console.log(`  Session:  ${fixtures.sessionId}`);
  console.log(`  Scenarios: ${Object.keys(toRun).join(", ")}`);

  // Verify server is reachable
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Health check returned ${res.status}`);
    console.log("  Server:   reachable\n");
  } catch {
    console.error(`\nERROR: Cannot reach server at ${baseUrl}`);
    console.error("Make sure the dev server is running: pnpm dev\n");
    process.exit(1);
  }

  const results: ScenarioResult[] = [];

  for (const [name, fn] of Object.entries(toRun)) {
    console.log(`Running: ${name}...`);
    try {
      const result = await fn(fixtures);
      results.push(result);
      printResult(result);
    } catch (err) {
      console.error(`  FAILED: ${(err as Error).message}`);
      console.error((err as Error).stack);
    }
    // Brief pause between scenarios
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary
  console.log("\n\n========== SUMMARY ==========");
  for (const r of results) {
    const status = r.failed === 0 ? "PASS" : r.failed / r.totalRequests < 0.05 ? "WARN" : "FAIL";
    console.log(
      `  [${status}] ${r.name}: ${r.successful}/${r.totalRequests} ok, ` +
        `avg=${r.avgMs.toFixed(0)}ms, p95=${r.p95Ms}ms, ${r.rps.toFixed(1)} req/s`
    );
  }
  console.log("=============================\n");

  // Exit with error if any scenario had >5% failure rate
  const anyFailed = results.some((r) => r.totalRequests > 0 && r.failed / r.totalRequests >= 0.05);
  process.exit(anyFailed ? 1 : 0);
}

main();
