/**
 * Centralized Redis key naming conventions.
 * Keeps keys consistent and human-readable.
 */

/**
 * Session cache key
 * Example: "session:{abc123}"
 */
export function session(sessionId: string): string {
  return `session:{${sessionId}}`;
}

/**
 * Rate limit key
 * Example: "ratelimit:{user-42}"
 */
export function rateLimit(key: string): string {
  return `ratelimit:{${key}}`;
}

