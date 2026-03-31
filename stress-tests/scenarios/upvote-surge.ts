/**
 * Scenario: Upvote Surge
 *
 * Creates a single question, then all 100 students upvote it simultaneously
 * via Socket.IO. Tests DB contention on the upvote counter and broadcast fan-out.
 */
import { PrismaClient } from "../../src/generated/prisma";
import { io, type Socket } from "socket.io-client";
import { mintCookie } from "../auth";
import { BASE_URL, summarize, type ScenarioResult, type StressFixtures } from "../utils";

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

export async function runUpvoteSurge(fixtures: StressFixtures): Promise<ScenarioResult> {
  // Create a question to upvote
  const question = await prisma.question.create({
    data: {
      sessionId: fixtures.sessionId,
      authorId: fixtures.students[0].id,
      content: "This is a popular question that everyone will upvote during the stress test.",
      visibility: "PUBLIC",
      isAnonymous: false,
    },
  });

  const cookies = await Promise.all(fixtures.students.map((s) => mintCookie(s, "STUDENT")));

  // Connect all 100 sockets
  console.log("  [upvote-surge] Connecting 100 sockets...");
  const sockets: Socket[] = [];
  for (let i = 0; i < cookies.length; i++) {
    try {
      const socket = await connectSocket(cookies[i], fixtures.sessionId);
      sockets.push(socket);
    } catch {
      console.warn(`  [upvote-surge] Socket ${i} failed to connect`);
    }
  }
  console.log(`  [upvote-surge] ${sockets.length} sockets connected`);

  const latencies: number[] = [];
  const errors: Record<string, number> = {};

  // Small delay to let all sockets stabilize
  await new Promise((r) => setTimeout(r, 500));

  const start = Date.now();

  // All sockets upvote at once
  const promises = sockets.map(
    (socket) =>
      new Promise<void>((resolve) => {
        const t0 = Date.now();
        const timeout = setTimeout(() => {
          errors["timeout"] = (errors["timeout"] || 0) + 1;
          resolve();
        }, 10_000);

        socket.once("question:updated", () => {
          clearTimeout(timeout);
          latencies.push(Date.now() - t0);
          resolve();
        });

        socket.once("question:error", (data: { message: string }) => {
          clearTimeout(timeout);
          const key = `socket: ${data.message}`;
          errors[key] = (errors[key] || 0) + 1;
          resolve();
        });

        socket.emit("question:upvote", { questionId: question.id });
      })
  );

  await Promise.all(promises);
  const duration = Date.now() - start;

  // Disconnect all sockets
  sockets.forEach((s) => s.disconnect());

  // Cleanup
  await prisma.questionUpvote.deleteMany({ where: { questionId: question.id } });
  await prisma.question.delete({ where: { id: question.id } });
  await prisma.$disconnect();

  return summarize("Upvote Surge (100 concurrent)", latencies, errors, duration);
}
