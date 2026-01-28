import { NextResponse } from "next/server";
import { redisCache, redisPubSub, redisRateLimit } from "@/lib/redis";

/**
 * Health check endpoint that verifies Redis connectivity
 * GET /api/health
 */
export async function GET() {
  try {
    // Ping all three Redis clients
    const [cacheStatus, pubSubStatus, rateLimitStatus] = await Promise.allSettled([
      redisCache.ping(),
      redisPubSub.ping(),
      redisRateLimit.ping(),
    ]);

    const allConnected =
      cacheStatus.status === "fulfilled" &&
      pubSubStatus.status === "fulfilled" &&
      rateLimitStatus.status === "fulfilled";

    const status = allConnected ? "ok" : "error";
    const redis = allConnected ? "connected" : "disconnected";

    return NextResponse.json(
      {
        status,
        redis,
      },
      {
        status: allConnected ? 200 : 503,
      },
    );
  } catch (error) {
    console.error("[Health] Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        redis: "disconnected",
      },
      {
        status: 503,
      },
    );
  }
}
