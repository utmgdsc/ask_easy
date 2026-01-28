import { redisRateLimit } from "./redis";
import { rateLimit } from "./redisKeys";

/**
 * Increment rate limit counter for a given key
 * @param key - The identifier for rate limiting (e.g., IP address, user ID)
 * @param windowSeconds - The time window in seconds
 * @returns The current count after increment
 */
export async function incrementRateLimit(
  key: string,
  windowSeconds: number,
): Promise<number> {
  try {
    const redisKey = rateLimit(key);
    const count = await redisRateLimit.incr(redisKey);
    
    // Set expiration on first increment (when count is 1)
    if (count === 1) {
      await redisRateLimit.expire(redisKey, windowSeconds);
    }
    
    return count;
  } catch (error) {
    console.error("[RateLimit] Failed to increment rate limit:", error);
    // On error, allow the request (fail open)
    return 0;
  }
}

/**
 * Check if a request should be rate limited
 * @param key - The identifier for rate limiting (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowSeconds - The time window in seconds
 * @returns true if rate limit is exceeded, false otherwise
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const count = await incrementRateLimit(key, windowSeconds);
    return count > limit;
  } catch (error) {
    console.error("[RateLimit] Failed to check rate limit:", error);
    // On error, allow the request (fail open)
    return false;
  }
}
