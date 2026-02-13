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

/**
 * Question rate-limit key (passed into checkRateLimit, which wraps it via rateLimit()).
 * Final Redis key: "ratelimit:{question:abc123}"
 */
export function questionRateLimit(userId: string): string {
  return `question:${userId}`;
}

/**
 * Answer rate-limit key (passed into checkRateLimit, which wraps it via rateLimit()).
 * Final Redis key: "ratelimit:{answer:abc123}"
 */
export function answerRateLimit(userId: string): string {
  return `answer:${userId}`;
}

/**
 * Slide upload rate-limit key (passed into checkRateLimit, which wraps it via rateLimit()).
 * Final Redis key: "ratelimit:{slide-upload:abc123}"
 */
export function slideUploadRateLimit(userId: string): string {
  return `slide-upload:${userId}`;
 * Upvote rate-limit key (passed into checkRateLimit, which wraps it via rateLimit()).
 * Final Redis key: "ratelimit:{upvote:abc123}"
 */
  
export function upvoteRateLimit(userId: string): string {
  return `upvote:${userId}`;
}

/**
 * Resolve rate-limit key (passed into checkRateLimit, which wraps it via rateLimit()).
 * Final Redis key: "ratelimit:{resolve:abc123}"
 */
export function resolveRateLimit(userId: string): string {
  return `resolve:${userId}`;
}
