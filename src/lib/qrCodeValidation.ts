import { ValidationResult } from "@/lib/sessionValidation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const QR_SIZE_MIN = 64;
export const QR_SIZE_MAX = 1024;
export const QR_SIZE_DEFAULT = 256;
export const QR_MARGIN_MIN = 0;
export const QR_MARGIN_MAX = 10;
export const QR_MARGIN_DEFAULT = 2;
export const QR_CACHE_TTL_SECONDS = 3600; // 1 hour
export const QR_RATE_LIMIT_COUNT = 20;
export const QR_RATE_LIMIT_WINDOW_SECONDS = 60; // 1 minute

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QRCodeOptions {
  format?: "svg" | "png" | "dataUrl";
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates QR code format.
 * Checks that format is one of: "svg", "png", "dataUrl".
 */
export function validateQRFormat(format: unknown): ValidationResult {
  if (!format || typeof format !== "string") {
    return { valid: false, error: "QR code format is required." };
  }

  const validFormats = ["svg", "png", "dataUrl"];
  if (!validFormats.includes(format)) {
    return {
      valid: false,
      error: 'QR code format must be one of: "svg", "png", "dataUrl".',
    };
  }

  return { valid: true };
}

/**
 * Validates QR code size.
 * Checks that size is a number between 64 and 1024 pixels.
 */
export function validateQRSize(size: unknown): ValidationResult {
  if (size === undefined || size === null) {
    return { valid: true }; // Size is optional
  }

  if (typeof size !== "number" || !Number.isInteger(size)) {
    return { valid: false, error: "QR code size must be an integer." };
  }

  if (size < QR_SIZE_MIN || size > QR_SIZE_MAX) {
    return {
      valid: false,
      error: `QR code size must be between ${QR_SIZE_MIN} and ${QR_SIZE_MAX} pixels.`,
    };
  }

  return { valid: true };
}

/**
 * Validates QR code margin.
 * Checks that margin is a number between 0 and 10 modules.
 */
export function validateQRMargin(margin: unknown): ValidationResult {
  if (margin === undefined || margin === null) {
    return { valid: true }; // Margin is optional
  }

  if (typeof margin !== "number" || !Number.isInteger(margin)) {
    return { valid: false, error: "QR code margin must be an integer." };
  }

  if (margin < QR_MARGIN_MIN || margin > QR_MARGIN_MAX) {
    return {
      valid: false,
      error: `QR code margin must be between ${QR_MARGIN_MIN} and ${QR_MARGIN_MAX} modules.`,
    };
  }

  return { valid: true };
}

/**
 * Validates QR code color (hex format).
 * Checks that color is a valid 6-digit hex color (e.g., #FF0000).
 */
export function validateQRColor(color: unknown, fieldName: string): ValidationResult {
  if (color === undefined || color === null) {
    return { valid: true }; // Color is optional
  }

  if (typeof color !== "string") {
    return { valid: false, error: `${fieldName} must be a string.` };
  }

  const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorPattern.test(color)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid hex color (e.g., #FF0000).`,
    };
  }

  return { valid: true };
}

/**
 * Validates all QR code options.
 * Returns validation result with error message if any option is invalid.
 */
export function validateQROptions(options: unknown): ValidationResult {
  if (!options || typeof options !== "object") {
    return { valid: false, error: "QR code options are required." };
  }

  const opts = options as Record<string, unknown>;

  // Validate format (optional, defaults to "svg")
  if (opts.format !== undefined) {
    const formatValidation = validateQRFormat(opts.format);
    if (!formatValidation.valid) {
      return formatValidation;
    }
  }

  // Validate size
  const sizeValidation = validateQRSize(opts.size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate margin
  const marginValidation = validateQRMargin(opts.margin);
  if (!marginValidation.valid) {
    return marginValidation;
  }

  // Validate dark color
  const darkColorValidation = validateQRColor(opts.darkColor, "Dark color");
  if (!darkColorValidation.valid) {
    return darkColorValidation;
  }

  // Validate light color
  const lightColorValidation = validateQRColor(opts.lightColor, "Light color");
  if (!lightColorValidation.valid) {
    return lightColorValidation;
  }

  return { valid: true };
}
