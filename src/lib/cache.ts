import { redisCache } from "./redis";
import { session } from "./redisKeys";

/**
 * Cache session data with TTL
 * @param sessionId - The session identifier
 * @param data - The data to cache (will be JSON serialized)
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheSession(
  sessionId: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    const key = session(sessionId);
    const serialized = JSON.stringify(data);
    await redisCache.setex(key, ttlSeconds, serialized);
  } catch (error) {
    console.error("[Cache] Failed to cache session:", error);
    // Don't throw - allow app to continue
  }
}

/**
 * Retrieve cached session data
 * @param sessionId - The session identifier
 * @returns The cached data or null if not found/expired
 */
export async function getSessionCache<T = unknown>(sessionId: string): Promise<T | null> {
  try {
    const key = session(sessionId);
    const cached = await redisCache.get(key);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error("[Cache] Failed to get session cache:", error);
    return null;
  }
}

/**
 * Invalidate a cached session
 * @param sessionId - The session identifier
 */
export async function invalidateSessionCache(sessionId: string): Promise<void> {
  try {
    const key = session(sessionId);
    await redisCache.del(key);
  } catch (error) {
    console.error("[Cache] Failed to invalidate session cache:", error);
    // Don't throw - allow app to continue
  }
}
