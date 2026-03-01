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
  // 1. Prepare the Next.js application
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();

  // 2. Create an HTTP server that delegates to Next.js
  const httpServer = createServer(handle);

  // 3. Attach Socket.IO (+ Redis adapter) to the same HTTP server
  await initSocketIO(httpServer);

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
