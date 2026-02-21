// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";

// ---------------------------------------------------------------------------
// Pure Function Tests (no mocking needed)
// ---------------------------------------------------------------------------

import { hasPdfMagicBytes, validatePdf, extractPageCount } from "@/lib/pdf";

import {
  validateFileType,
  validateFileSize,
  SLIDE_MAX_FILE_SIZE,
  SLIDE_MIN_FILE_SIZE,
} from "@/lib/slideValidation";

import { generateSlideStorageKey } from "@/lib/storage";

describe("hasPdfMagicBytes", () => {
  it("returns true for valid PDF magic bytes", () => {
    // %PDF- in hex: 25 50 44 46 2D
    const validPdfStart = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(hasPdfMagicBytes(validPdfStart)).toBe(true);
  });

  it("returns false for non-PDF files", () => {
    // PNG magic bytes
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(hasPdfMagicBytes(pngBuffer)).toBe(false);
  });

  it("returns false for empty buffer", () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(hasPdfMagicBytes(emptyBuffer)).toBe(false);
  });

  it("returns false for buffer shorter than magic bytes", () => {
    const shortBuffer = Buffer.from([0x25, 0x50]);
    expect(hasPdfMagicBytes(shortBuffer)).toBe(false);
  });

  it("returns false for buffer starting with partial PDF magic", () => {
    const partialBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00]); // %PDF followed by null instead of -
    expect(hasPdfMagicBytes(partialBuffer)).toBe(false);
  });
});

describe("validateFileType", () => {
  it("accepts application/pdf", () => {
    const result = validateFileType("application/pdf");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects null mime type", () => {
    const result = validateFileType(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("rejects image/png", () => {
    const result = validateFileType("image/png");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("rejects application/octet-stream", () => {
    const result = validateFileType("application/octet-stream");
    expect(result.valid).toBe(false);
  });

  it("rejects text/plain", () => {
    const result = validateFileType("text/plain");
    expect(result.valid).toBe(false);
  });
});

describe("validateFileSize", () => {
  it("accepts valid file size", () => {
    const result = validateFileSize(1024 * 1024); // 1MB
    expect(result.valid).toBe(true);
  });

  it("rejects file smaller than minimum", () => {
    const result = validateFileSize(SLIDE_MIN_FILE_SIZE - 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too small");
    expect(result.statusCode).toBe(400);
  });

  it("accepts file exactly at minimum size", () => {
    const result = validateFileSize(SLIDE_MIN_FILE_SIZE);
    expect(result.valid).toBe(true);
  });

  it("rejects file larger than maximum", () => {
    const result = validateFileSize(SLIDE_MAX_FILE_SIZE + 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
    expect(result.statusCode).toBe(413);
  });

  it("accepts file exactly at maximum size", () => {
    const result = validateFileSize(SLIDE_MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
  });
});

describe("generateSlideStorageKey", () => {
  it("generates correct storage key format", () => {
    const key = generateSlideStorageKey("session-123", "slideset-456");
    expect(key).toBe("sessions/session-123/slides/slideset-456.pdf");
  });

  it("handles UUIDs correctly", () => {
    const sessionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const slideSetId = "x1y2z3w4-5678-9abc-def0-123456789abc";
    const key = generateSlideStorageKey(sessionId, slideSetId);
    expect(key).toBe(`sessions/${sessionId}/slides/${slideSetId}.pdf`);
  });
});

// ---------------------------------------------------------------------------
// Mocked PDF Parsing Tests
// ---------------------------------------------------------------------------

describe("validatePdf with mocked pdf-lib", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns valid for a parseable PDF", async () => {
    // Create a minimal valid PDF for testing
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await validatePdf(buffer);
    expect(result.valid).toBe(true);
  });

  it("returns invalid for non-PDF content with PDF magic bytes", async () => {
    // Create a buffer that starts with PDF magic but isn't a valid PDF
    const fakeBuffer = Buffer.concat([
      Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]), // %PDF-
      Buffer.from("not a valid pdf content"),
    ]);

    const result = await validatePdf(fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("corrupted or malformed");
  });

  it("returns invalid when magic bytes are missing", async () => {
    const notPdfBuffer = Buffer.from("This is not a PDF file");

    const result = await validatePdf(notPdfBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("does not start with PDF signature");
  });
});

describe("extractPageCount", () => {
  it("returns correct page count for single-page PDF", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const pageCount = await extractPageCount(buffer);
    expect(pageCount).toBe(1);
  });

  it("returns correct page count for multi-page PDF", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    pdfDoc.addPage();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const pageCount = await extractPageCount(buffer);
    expect(pageCount).toBe(3);
  });

  it("throws error for invalid PDF", async () => {
    const invalidBuffer = Buffer.from("not a pdf");

    await expect(extractPageCount(invalidBuffer)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Mocked Storage Tests
// ---------------------------------------------------------------------------

// Mock fs module for storage tests
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      writeFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(Buffer.from("mock file content")),
      access: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe("storage functions with mocked fs", () => {
  let uploadFile: typeof import("@/lib/storage").uploadFile;
  let deleteFile: typeof import("@/lib/storage").deleteFile;
  let readFile: typeof import("@/lib/storage").readFile;
  let fileExists: typeof import("@/lib/storage").fileExists;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to get fresh module with mocks
    const storage = await import("@/lib/storage");
    uploadFile = storage.uploadFile;
    deleteFile = storage.deleteFile;
    readFile = storage.readFile;
    fileExists = storage.fileExists;
  });

  it("uploadFile returns the storage key", async () => {
    const buffer = Buffer.from("test content");
    const key = await uploadFile("test/path/file.pdf", buffer, "application/pdf");
    expect(key).toBe("test/path/file.pdf");
  });

  it("deleteFile completes without error", async () => {
    await expect(deleteFile("test/path/file.pdf")).resolves.not.toThrow();
  });

  it("readFile returns buffer", async () => {
    const result = await readFile("test/path/file.pdf");
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("fileExists returns true when file exists", async () => {
    const exists = await fileExists("test/path/file.pdf");
    expect(exists).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mocked Prisma Validation Tests
// ---------------------------------------------------------------------------

// Use vi.hoisted to ensure mocks are created before hoisting
const { mockSessionFindUnique, mockCourseEnrollmentFindUnique } = vi.hoisted(() => ({
  mockSessionFindUnique: vi.fn(),
  mockCourseEnrollmentFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: mockSessionFindUnique,
    },
    courseEnrollment: {
      findUnique: mockCourseEnrollmentFindUnique,
    },
  },
}));

describe("validateSessionForUpload with mocked Prisma", () => {
  let validateSessionForUpload: typeof import("@/lib/slideValidation").validateSessionForUpload;

  beforeEach(async () => {
    vi.clearAllMocks();
    const validationModule = await import("@/lib/slideValidation");
    validateSessionForUpload = validationModule.validateSessionForUpload;
  });

  it("returns invalid when session not found", async () => {
    mockSessionFindUnique.mockResolvedValue(null);

    const result = await validateSessionForUpload("non-existent-session");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Session not found.");
  });

  it("returns invalid for ended session", async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: "session-1",
      status: "ENDED",
    });

    const result = await validateSessionForUpload("session-1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ended session");
  });

  it("returns valid for active session", async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: "session-1",
      status: "ACTIVE",
    });

    const result = await validateSessionForUpload("session-1");
    expect(result.valid).toBe(true);
    expect(result.session).toEqual({ id: "session-1", status: "ACTIVE" });
  });

  it("returns valid for scheduled session", async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: "session-1",
      status: "SCHEDULED",
    });

    const result = await validateSessionForUpload("session-1");
    expect(result.valid).toBe(true);
  });
});

describe("validateUserIsProfessor with mocked Prisma", () => {
  let validateUserIsProfessor: typeof import("@/lib/slideValidation").validateUserIsProfessor;

  beforeEach(async () => {
    vi.clearAllMocks();
    const validationModule = await import("@/lib/slideValidation");
    validateUserIsProfessor = validationModule.validateUserIsProfessor;
  });

  it("returns invalid when session not found", async () => {
    mockSessionFindUnique.mockResolvedValue(null);

    const result = await validateUserIsProfessor("user-1", "non-existent-session");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Session not found.");
  });

  it("returns invalid when user is not enrolled", async () => {
    mockSessionFindUnique.mockResolvedValue({
      courseId: "course-1",
    });
    mockCourseEnrollmentFindUnique.mockResolvedValue(null);

    const result = await validateUserIsProfessor("user-1", "session-1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not enrolled");
  });

  it("returns invalid when user is a student", async () => {
    mockSessionFindUnique.mockResolvedValue({
      courseId: "course-1",
    });
    mockCourseEnrollmentFindUnique.mockResolvedValue({
      role: "STUDENT",
    });

    const result = await validateUserIsProfessor("user-1", "session-1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Only professors");
  });

  it("returns invalid when user is a TA", async () => {
    mockSessionFindUnique.mockResolvedValue({
      courseId: "course-1",
    });
    mockCourseEnrollmentFindUnique.mockResolvedValue({
      role: "TA",
    });

    const result = await validateUserIsProfessor("user-1", "session-1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Only professors");
  });

  it("returns valid when user is a professor", async () => {
    mockSessionFindUnique.mockResolvedValue({
      courseId: "course-1",
    });
    mockCourseEnrollmentFindUnique.mockResolvedValue({
      role: "PROFESSOR",
    });

    const result = await validateUserIsProfessor("user-1", "session-1");
    expect(result.valid).toBe(true);
    expect(result.isProfessor).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Helper to create minimal test PDFs
// ---------------------------------------------------------------------------

export async function createTestPdf(pageCount: number = 1): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
