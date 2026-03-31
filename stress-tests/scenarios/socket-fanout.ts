/**
 * Scenario: Socket.IO Fan-out
 *
 * Connects 100 students via Socket.IO, then the professor posts a question.
 * Measures how long it takes for all 100 clients to receive the broadcast.
 * Tests real-time delivery latency under load.
 */
import { io, type Socket } from "socket.io-client";
import { mintCookie } from "../auth";
import { BASE_URL, summarize, type ScenarioResult, type StressFixtures } from "../utils";

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

export async function runSocketFanout(fixtures: StressFixtures): Promise<ScenarioResult> {
  const studentCookies = await Promise.all(fixtures.students.map((s) => mintCookie(s, "STUDENT")));
  const profCookie = await mintCookie(
    { id: fixtures.professorId, utorid: fixtures.professorUtorid },
    "PROFESSOR"
  );

  // Connect all 100 student sockets
  console.log("  [socket-fanout] Connecting 100 student sockets...");
  const studentSockets: Socket[] = [];
  for (const cookie of studentCookies) {
    try {
      const socket = await connectSocket(cookie, fixtures.sessionId);
      studentSockets.push(socket);
    } catch {
      // skip failed connections
    }
  }
  console.log(`  [socket-fanout] ${studentSockets.length} students connected`);

  // Connect professor socket
  const profSocket = await connectSocket(profCookie, fixtures.sessionId);

  const latencies: number[] = [];
  const errors: Record<string, number> = {};

  await new Promise((r) => setTimeout(r, 500));

  // Set up listeners on all student sockets BEFORE the professor sends
  const start = Date.now();
  const broadcastStart = Date.now();

  const receivePromises = studentSockets.map(
    (socket) =>
      new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          errors["timeout"] = (errors["timeout"] || 0) + 1;
          resolve();
        }, 10_000);

        socket.once("question:created", () => {
          clearTimeout(timeout);
          latencies.push(Date.now() - broadcastStart);
          resolve();
        });
      })
  );

  // Professor creates a question via socket
  profSocket.emit("question:create", {
    sessionId: fixtures.sessionId,
    content: "Fan-out test question from the professor to all 100 students in this session.",
    visibility: "PUBLIC",
    isAnonymous: false,
  });

  await Promise.all(receivePromises);
  const duration = Date.now() - start;

  // Cleanup
  studentSockets.forEach((s) => s.disconnect());
  profSocket.disconnect();

  return summarize(
    `Socket.IO Fan-out (1 -> ${studentSockets.length} clients)`,
    latencies,
    errors,
    duration
  );
}
