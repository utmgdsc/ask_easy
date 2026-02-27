import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  validateFileType,
  validateFileSize,
  validatePdfContent,
  validateSessionForUpload,
  validateUserIsProfessor,
  checkSlideUploadRateLimit,
} from "@/lib/slideValidation";
import { extractPageCount } from "@/lib/pdf";
import { uploadFile, deleteFile, generateSlideStorageKey } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ---------------------------------------------------------------------------
// GET /api/sessions/[sessionId]/slides
// ---------------------------------------------------------------------------

/**
 * Retrieves all slide sets for a given session.
 *
 * Returns slide sets ordered by createdAt descending (newest first).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Fetch slide sets with uploader info
    const slideSets = await prisma.slideSet.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { slides: true },
        },
      },
    });

    // Transform response
    const transformedSlideSets = slideSets.map((ss) => ({
      id: ss.id,
      filename: ss.filename,
      pageCount: ss.pageCount,
      fileSize: ss.fileSize,
      uploader: ss.uploader,
      createdAt: ss.createdAt,
    }));

    return NextResponse.json({
      sessionId,
      slideSets: transformedSlideSets,
      count: transformedSlideSets.length,
    });
  } catch (error) {
    console.error("[Slides API] Failed to fetch slide sets:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching slides." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/sessions/[sessionId]/slides
// ---------------------------------------------------------------------------

/**
 * Uploads a PDF file to a session.
 *
 * Request body (multipart/form-data):
 *   - file: PDF file (required, max 50MB)
 *   - userId: string (required, temporary until auth implemented)
 *
 * Validations (in order - cheap checks first):
 *   1. File exists in form data
 *   2. MIME type is PDF
 *   3. File size within bounds (1KB - 50MB)
 *   4. PDF content is valid (magic bytes + parseable)
 *   5. User is professor for the session's course
 *   6. Rate limit (5 uploads per 5 minutes per user)
 *   7. Session exists and is not ended
 *
 * Creates SlideSet and individual Slide records for each page.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  let storageKey: string | null = null;

  try {
    const { sessionId } = await params;

    // TODO: Add in real authentication for profs once UofT auth is added

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    // 1. Validate file exists
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // TO-DO: Replace with auth - currently using userId from form data
    const userId = formData.get("userId") as string | null;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // 2. Validate MIME type
    const typeValidation = validateFileType(file.type);
    if (!typeValidation.valid) {
      return NextResponse.json({ error: typeValidation.error }, { status: 400 });
    }

    // 3. Validate file size
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: sizeValidation.statusCode || 400 }
      );
    }

    // Read file into buffer for content validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Validate PDF content
    const contentValidation = await validatePdfContent(buffer);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    // 5. Validate user is professor
    const roleValidation = await validateUserIsProfessor(userId, sessionId);
    if (!roleValidation.valid) {
      const statusCode = roleValidation.error === "Session not found." ? 404 : 403;
      return NextResponse.json({ error: roleValidation.error }, { status: statusCode });
    }

    // 6. Check rate limit
    const isRateLimited = await checkSlideUploadRateLimit(userId);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before uploading another file." },
        { status: 429 }
      );
    }

    // 7. Validate session
    const sessionValidation = await validateSessionForUpload(sessionId);
    if (!sessionValidation.valid) {
      const statusCode = sessionValidation.error === "Session not found." ? 404 : 403;
      return NextResponse.json({ error: sessionValidation.error }, { status: statusCode });
    }

    // Extract page count
    const pageCount = await extractPageCount(buffer);

    // Generate a temporary ID for storage key (will be replaced with actual ID)
    const tempId = crypto.randomUUID();
    const generatedStorageKey = generateSlideStorageKey(sessionId, tempId);
    storageKey = generatedStorageKey;

    // Upload file to storage first
    await uploadFile(generatedStorageKey, buffer, file.type);

    // Create database records in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create SlideSet
        const slideSet = await tx.slideSet.create({
          data: {
            sessionId,
            filename: file.name,
            storageKey: generatedStorageKey,
            pageCount,
            fileSize: file.size,
            uploadedBy: userId,
          },
        });

        // Create individual Slide records for each page
        const slideData = Array.from({ length: pageCount }, (_, i) => ({
          slideSetId: slideSet.id,
          pageNumber: i + 1,
        }));

        await tx.slide.createMany({
          data: slideData,
        });

        return slideSet;
      });

      // Return success response
      return NextResponse.json(
        {
          slideSetId: result.id,
          filename: result.filename,
          pageCount: result.pageCount,
          fileSize: result.fileSize,
          createdAt: result.createdAt,
        },
        { status: 201 }
      );
    } catch (dbError) {
      // Database failed - clean up storage file
      console.error("[Slides API] Database transaction failed, cleaning up storage:", dbError);
      if (storageKey) {
        await deleteFile(storageKey);
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[Slides API] Failed to upload slides:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the file." },
      { status: 500 }
    );
  }
}
