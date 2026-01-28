/**
 * Centralized Redis key naming conventions
 * Ensures consistent, human-readable keys across the application
 */

/**
 * Generate a session cache key
 * @param sessionId - The session identifier
 * @returns Redis key: "session:{sessionId}"
 */
export function session(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Generate a rate limit key
 * @param key - The identifier for rate limiting (e.g., IP address, user ID)
 * @returns Redis key: "ratelimit:{key}"
 */
export function rateLimit(key: string): string {
  return `ratelimit:${key}`;
}
