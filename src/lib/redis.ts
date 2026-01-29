import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Redis client for general caching (DB 0)
 */
export const redisCache = new Redis(REDIS_URL, {
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

/**
 * Redis client for pub/sub operations (DB 1)
 */
export const redisPubSub = new Redis(REDIS_URL, {
  db: 1,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

/**
 * Redis client for rate limiting (DB 2)
 */
export const redisRateLimit = new Redis(REDIS_URL, {
  db: 2,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Error handlers - log but don't crash
redisCache.on("error", (error) => {
  console.error("[Redis Cache] Error:", error);
});

redisPubSub.on("error", (error) => {
  console.error("[Redis PubSub] Error:", error);
});

redisRateLimit.on("error", (error) => {
  console.error("[Redis RateLimit] Error:", error);
});

// Connection handlers for debugging
redisCache.on("connect", () => {
  console.log("[Redis Cache] Connected");
});

redisPubSub.on("connect", () => {
  console.log("[Redis PubSub] Connected");
});

redisRateLimit.on("connect", () => {
  console.log("[Redis RateLimit] Connected");
});

// Graceful shutdown
const shutdown = async () => {
  await Promise.all([
    redisCache.quit().catch(() => {}),
    redisPubSub.quit().catch(() => {}),
    redisRateLimit.quit().catch(() => {}),
  ]);
};

if (typeof process !== "undefined") {
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
