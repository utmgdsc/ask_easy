import QRCode from "qrcode";
import { createHash } from "crypto";

import { redisCache } from "@/lib/redis";
import { qrCode as qrCodeKey } from "@/lib/redisKeys";
import {
  QRCodeOptions,
  QR_SIZE_DEFAULT,
  QR_MARGIN_DEFAULT,
  QR_CACHE_TTL_SECONDS,
} from "@/lib/qrCodeValidation";

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Hashes QR code options to create a deterministic cache key.
 * Normalizes options with defaults before hashing.
 */
export function hashQROptions(options: QRCodeOptions): string {
  const normalized = {
    format: options.format || "svg",
    size: options.size || QR_SIZE_DEFAULT,
    margin: options.margin || QR_MARGIN_DEFAULT,
    darkColor: options.darkColor || "#000000",
    lightColor: options.lightColor || "#FFFFFF",
  };

  const hash = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .substring(0, 16); // First 16 chars sufficient for uniqueness

  return hash;
}

// ---------------------------------------------------------------------------
// QR Code Generation
// ---------------------------------------------------------------------------

/**
 * Generates a QR code for the given URL with specified options.
 * Low-level function that directly generates QR codes.
 *
 * @param url - The URL to encode in the QR code
 * @param options - QR code generation options (format, size, colors, etc.)
 * @returns QR code as string (SVG, PNG base64, or data URL)
 */
export async function generateQRCode(
  url: string,
  options: QRCodeOptions
): Promise<string> {
  const format = options.format || "svg";
  const size = options.size || QR_SIZE_DEFAULT;
  const margin = options.margin || QR_MARGIN_DEFAULT;
  const darkColor = options.darkColor || "#000000";
  const lightColor = options.lightColor || "#FFFFFF";

  const qrOptions = {
    errorCorrectionLevel: "M" as const, // ~15% damage tolerance
    width: size,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  };

  try {
    if (format === "svg") {
      // Generate SVG string
      const svg = await QRCode.toString(url, {
        type: "svg",
        ...qrOptions,
      });
      return svg;
    } else if (format === "png") {
      // Generate PNG as base64 string
      const buffer = await QRCode.toBuffer(url, {
        type: "png",
        ...qrOptions,
      });
      return buffer.toString("base64");
    } else if (format === "dataUrl") {
      // Generate data URL
      const dataUrl = await QRCode.toDataURL(url, qrOptions);
      return dataUrl;
    }

    throw new Error(`Unsupported QR code format: ${format}`);
  } catch (error) {
    console.error("[QR Code] Failed to generate QR code:", error);
    throw new Error("Failed to generate QR code.");
  }
}

// ---------------------------------------------------------------------------
// Cache Operations
// ---------------------------------------------------------------------------

/**
 * Retrieves a cached QR code from Redis.
 * Returns null if cache miss or error.
 *
 * @param sessionId - The session ID
 * @param options - QR code options (used to generate cache key)
 * @returns Cached QR code or null
 */
export async function getCachedQR(
  sessionId: string,
  options: QRCodeOptions
): Promise<string | null> {
  try {
    const optionsHash = hashQROptions(options);
    const key = qrCodeKey(sessionId, optionsHash);

    const cached = await redisCache.get(key);
    return cached;
  } catch (error) {
    console.error("[QR Code] Failed to retrieve cached QR code:", error);
    return null; // Fail open
  }
}

/**
 * Caches a generated QR code in Redis with TTL.
 * Fails silently on error.
 *
 * @param sessionId - The session ID
 * @param options - QR code options (used to generate cache key)
 * @param qrData - The QR code data to cache
 */
export async function cacheQR(
  sessionId: string,
  options: QRCodeOptions,
  qrData: string
): Promise<void> {
  try {
    const optionsHash = hashQROptions(options);
    const key = qrCodeKey(sessionId, optionsHash);

    await redisCache.setex(key, QR_CACHE_TTL_SECONDS, qrData);
  } catch (error) {
    console.error("[QR Code] Failed to cache QR code:", error);
    // Fail silently - caching is not critical
  }
}

/**
 * Invalidates all cached QR codes for a session.
 * Called when the session join code is regenerated.
 *
 * @param sessionId - The session ID
 */
export async function invalidateQRCache(sessionId: string): Promise<void> {
  try {
    // Find all cache keys matching the pattern
    const pattern = `qr:${sessionId}:*`;
    const keys = await redisCache.keys(pattern);

    if (keys.length > 0) {
      await redisCache.del(...keys);
      console.log(`[QR Code] Invalidated ${keys.length} cached QR code(s) for session ${sessionId}`);
    }
  } catch (error) {
    console.error("[QR Code] Failed to invalidate QR code cache:", error);
    // Fail silently - cache invalidation is not critical
  }
}

// ---------------------------------------------------------------------------
// High-Level Session QR Generation
// ---------------------------------------------------------------------------

/**
 * Generates a QR code for a session join URL.
 * Checks cache first, generates if cache miss, then caches result.
 *
 * @param sessionId - The session ID
 * @param joinCode - The session join code
 * @param options - QR code generation options
 * @returns QR code as string (format depends on options.format)
 */
export async function generateSessionJoinQR(
  sessionId: string,
  joinCode: string,
  options: QRCodeOptions
): Promise<string> {
  // Check cache first
  const cached = await getCachedQR(sessionId, options);
  if (cached) {
    return cached;
  }

  // Construct join URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const joinUrl = `${appUrl}/join/${joinCode}`;

  // Generate QR code
  const qrCode = await generateQRCode(joinUrl, options);

  // Cache the result
  await cacheQR(sessionId, options, qrCode);

  return qrCode;
}
