import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// In production, remove 'unsafe-eval' to strengthen XSS protection.
// In development, Next.js HMR requires 'unsafe-eval'.
// Production needs 'wasm-unsafe-eval' so @embedpdf/pdfium (WebAssembly) can run under CSP.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["socket.io", "ioredis", "@socket.io/redis-adapter"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob:",
              // Allow WebSocket connections to the same host (Socket.IO)
              "connect-src 'self' ws: wss: https://cdn.jsdelivr.net",
              "worker-src 'self' blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
