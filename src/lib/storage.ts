import { promises as fs } from "fs";
import path from "path";

// Base directory for file uploads (relative to project root)
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Resolves a storage key to an absolute path and validates that it stays
 * within UPLOADS_DIR to prevent path traversal attacks.
 */
function resolveStoragePath(key: string): string {
  const resolved = path.resolve(UPLOADS_DIR, key);
  // Ensure the resolved path starts with the uploads directory.
  // path.sep ensures we don't match a directory that is a prefix of another
  // (e.g. /uploads-extra vs /uploads).
  if (!resolved.startsWith(UPLOADS_DIR + path.sep) && resolved !== UPLOADS_DIR) {
    throw new Error(`Invalid storage key: path traversal detected in "${key}"`);
  }
  return resolved;
}

/**
 * Ensures the directory exists, creating it if necessary
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Uploads a file to local storage
 * @param key - Storage key (e.g., "sessions/{sessionId}/slides/{slideSetId}.pdf")
 * @param buffer - File content as Buffer
 * @param _contentType - MIME type (unused for local storage, kept for interface compatibility)
 * @returns The storage key
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for interface compatibility
  _contentType: string
): Promise<string> {
  const filePath = resolveStoragePath(key);
  const dirPath = path.dirname(filePath);

  await ensureDirectory(dirPath);
  await fs.writeFile(filePath, buffer);

  return key;
}

/**
 * Deletes a file from local storage
 * @param key - Storage key
 */
export async function deleteFile(key: string): Promise<void> {
  const filePath = resolveStoragePath(key);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Gets the absolute file path for a storage key
 * @param key - Storage key
 * @returns Absolute file path
 */
export function getFilePath(key: string): string {
  return resolveStoragePath(key);
}

/**
 * Checks if a file exists in storage
 * @param key - Storage key
 * @returns true if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const filePath = resolveStoragePath(key);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a file from storage
 * @param key - Storage key
 * @returns File content as Buffer
 */
export async function readFile(key: string): Promise<Buffer> {
  const filePath = resolveStoragePath(key);
  return fs.readFile(filePath);
}

/**
 * Generates a storage key for slide uploads
 * @param sessionId - Session ID
 * @param slideSetId - SlideSet ID
 * @returns Storage key path
 */
export function generateSlideStorageKey(sessionId: string, slideSetId: string): string {
  return `sessions/${sessionId}/slides/${slideSetId}.pdf`;
}
