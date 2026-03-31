/**
 * Scenario: Mixed Realistic Load
 *
 * Simulates a realistic lecture session with 100 students over 30 seconds:
 * - Students randomly post questions (via REST)
 * - Students randomly fetch the question list (via REST)
 * - Students upvote questions (via Socket.IO)
 *
 * Each student performs a random action every 1-3 seconds.
 */
import { PrismaClient } from "../../src/generated/prisma";
import { io, type Socket } from "socket.io-client";
import { mintCookie } from "../auth";
import { BASE_URL, summarize, type ScenarioResult, type StressFixtures } from "../utils";

const DURATION_MS = 30_000;

const prisma = new PrismaClient();

function connectSocket(cookie: string, sessionId: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(BASE_URL, {
      extraHeaders: { cookie },
      transports: ["websocket"],
    });
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Socket connection timeout"));
    }, 10_000);
    socket.on("connect", () => {
      socket.emit("session:join", { sessionId });
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function randomDelay(): Promise<void> {
  const ms = 1000 + Math.random() * 2000; // 1-3 seconds
  return new Promise((r) => setTimeout(r, ms));
}

export async function runMixedLoad(fixtures: StressFixtures): Promise<ScenarioResult> {
  const cookies = await Promise.all(fixtures.students.map((s) => mintCookie(s, "STUDENT")));

  // Connect sockets for all students
  console.log("  [mixed-load] Connecting 100 sockets...");
  const sockets: (Socket | null)[] = [];
  for (const cookie of cookies) {
    try {
      sockets.push(await connectSocket(cookie, fixtures.sessionId));
    } catch {
      sockets.push(null);
    }
  }
  const connectedCount = sockets.filter(Boolean).length;
  console.log(`  [mixed-load] ${connectedCount} sockets connected`);
  console.log(`  [mixed-load] Running mixed load for ${DURATION_MS / 1000}s...`);

  const latencies: number[] = [];
  const errors: Record<string, number> = {};
  const questionIds: string[] = [];
  let running = true;

  const start = Date.now();

  // Each student runs a loop of random actions
  const workers = fixtures.students.map(async (student, i) => {
    const cookie = cookies[i];
    const socket = sockets[i];

    while (running) {
      await randomDelay();
      if (!running) break;

      const action = Math.random();
      const t0 = Date.now();

      try {
        if (action < 0.3) {
          // 30% chance: post a question
          const res = await fetch(`${BASE_URL}/api/sessions/${fixtures.sessionId}/questions`, {
            method: "POST",
            headers: { cookie, "content-type": "application/json" },
            body: JSON.stringify({
              content: `Mixed load question from student ${i} at ${Date.now()}. What do you think about this topic?`,
              visibility: "PUBLIC",
              isAnonymous: Math.random() > 0.5,
            }),
          });
          const elapsed = Date.now() - t0;
          if (res.ok) {
            latencies.push(elapsed);
            const body = await res.json();
            if (body.id) questionIds.push(body.id);
          } else {
            const body = await res.json().catch(() => ({}));
            const key = `post-q ${res.status}: ${body.error || "unknown"}`;
            errors[key] = (errors[key] || 0) + 1;
          }
        } else if (action < 0.6) {
          // 30% chance: fetch questions
          const res = await fetch(
            `${BASE_URL}/api/sessions/${fixtures.sessionId}/questions?limit=20&sortBy=newest`,
            { headers: { cookie } }
          );
          const elapsed = Date.now() - t0;
          if (res.ok) {
            latencies.push(elapsed);
          } else {
            const key = `get-q ${res.status}`;
            errors[key] = (errors[key] || 0) + 1;
          }
        } else if (action < 0.9 && socket && questionIds.length > 0) {
          // 30% chance: upvote a random question via socket
          const qid = questionIds[Math.floor(Math.random() * questionIds.length)];
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              errors["upvote-timeout"] = (errors["upvote-timeout"] || 0) + 1;
              resolve();
            }, 5000);

            const handler = () => {
              clearTimeout(timeout);
              latencies.push(Date.now() - t0);
              resolve();
            };

            socket.once("question:updated", handler);
            socket.once("question:error", () => {
              clearTimeout(timeout);
              socket.off("question:updated", handler);
              // Upvote toggle (un-upvoting) is expected, don't count as error
              latencies.push(Date.now() - t0);
              resolve();
            });

            socket.emit("question:upvote", { questionId: qid });
          });
        } else {
          // 10% chance (or fallback): health check
          const res = await fetch(`${BASE_URL}/api/health`);
          const elapsed = Date.now() - t0;
          if (res.ok) {
            latencies.push(elapsed);
          } else {
            errors["health-fail"] = (errors["health-fail"] || 0) + 1;
          }
        }
      } catch (err) {
        const key = `network: ${(err as Error).message.slice(0, 60)}`;
        errors[key] = (errors[key] || 0) + 1;
      }
    }
  });

  // Stop after DURATION_MS
  await new Promise((r) => setTimeout(r, DURATION_MS));
  running = false;

  // Give workers a moment to finish their current action
  await Promise.race([Promise.all(workers), new Promise((r) => setTimeout(r, 5000))]);

  const duration = Date.now() - start;

  // Disconnect all sockets
  sockets.forEach((s) => s?.disconnect());
  await prisma.$disconnect();

  return summarize("Mixed Realistic Load (100 students, 30s)", latencies, errors, duration);
}
