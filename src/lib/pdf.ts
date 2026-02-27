import { PDFDocument } from "pdf-lib";

// PDF magic bytes: %PDF-
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];

// Timeout for PDF parsing operations (prevents DoS with malicious PDFs)
export const PDF_PARSE_TIMEOUT_MS = 10000;

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
}

export interface PdfMetadata {
  pageCount: number;
}

/**
 * Validates PDF magic bytes at the start of the file
 * @param buffer - File buffer
 * @returns true if buffer starts with PDF magic bytes
 */
export function hasPdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < PDF_MAGIC_BYTES.length) {
    return false;
  }

  for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
    if (buffer[i] !== PDF_MAGIC_BYTES[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("PDF parsing timeout")), ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Validates that a buffer contains a valid, parseable PDF
 * @param buffer - File buffer
 * @returns Validation result
 */
export async function validatePdf(buffer: Buffer): Promise<PdfValidationResult> {
  // Check magic bytes first (fast check)
  if (!hasPdfMagicBytes(buffer)) {
    return {
      valid: false,
      error: "Invalid PDF: file does not start with PDF signature",
    };
  }

  // Attempt to parse the PDF (catches corrupted files)
  try {
    await withTimeout(PDFDocument.load(buffer, { ignoreEncryption: true }), PDF_PARSE_TIMEOUT_MS);
    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.message === "PDF parsing timeout") {
      return {
        valid: false,
        error: "PDF parsing timeout: file may be too complex or corrupted",
      };
    }

    return {
      valid: false,
      error: "Invalid PDF: file is corrupted or malformed",
    };
  }
}

/**
 * Extracts page count from a PDF buffer
 * @param buffer - File buffer (must be validated first)
 * @returns Page count
 * @throws Error if PDF cannot be parsed
 */
export async function extractPageCount(buffer: Buffer): Promise<number> {
  const pdfDoc = await withTimeout(
    PDFDocument.load(buffer, { ignoreEncryption: true }),
    PDF_PARSE_TIMEOUT_MS
  );

  return pdfDoc.getPageCount();
}

/**
 * Extracts metadata from a PDF buffer
 * @param buffer - File buffer (must be validated first)
 * @returns PDF metadata including page count
 */
export async function extractPdfMetadata(buffer: Buffer): Promise<PdfMetadata> {
  const pageCount = await extractPageCount(buffer);

  return {
    pageCount,
  };
}
