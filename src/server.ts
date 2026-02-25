import { createServer } from "node:http";
import next from "next";

import { initSocketIO } from "./socket";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("1. Preparing Next.js...");
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  try {
    await app.prepare();
    console.log("Next.js prepared successfully.");
  } catch (err) {
    console.error("Next.js prepare failed:", err);
    throw err;
  }

  // 2. Create an HTTP server that delegates to Next.js
  const httpServer = createServer(handle);

  console.log("2. Init Socket.IO...");
  // 3. Attach Socket.IO (+ Redis adapter) to the same HTTP server
  try {
    await initSocketIO(httpServer);
    console.log("Socket.IO initialized successfully.");
  } catch (err) {
    console.error("Socket.IO init failed:", err);
    throw err;
  }

  // 4. Start listening
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (${dev ? "development" : "production"})`);
    console.log(`> Socket.IO server attached`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
