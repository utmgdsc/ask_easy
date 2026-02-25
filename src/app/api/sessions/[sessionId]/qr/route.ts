import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { qrCodeRateLimit } from "@/lib/redisKeys";
import { generateSessionJoinQR } from "@/lib/qrCode";
import {
  validateQROptions,
  QRCodeOptions,
  QR_RATE_LIMIT_COUNT,
  QR_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/qrCodeValidation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * GET /api/sessions/[sessionId]/qr
 *
 * Generates a QR code for the session join URL.
 * Only the session creator (professor) can generate QR codes.
 * Results are cached for 1 hour.
 *
 * Query parameters:
 * - userId: string (required) - For rate limiting and authorization
 * - format: "svg" | "png" | "dataUrl" (optional, default: "svg")
 * - size: number (optional, default: 256, range: 64-1024)
 * - margin: number (optional, default: 2, range: 0-10)
 * - darkColor: string (optional, default: "#000000", hex format)
 * - lightColor: string (optional, default: "#FFFFFF", hex format)
 *
 * Returns:
 * - 200: QR code generated successfully (Content-Type depends on format)
 * - 400: Invalid parameters
 * - 403: User is not the session creator
 * - 404: Session not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Extract sessionId from params
    const { sessionId } = await params;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);

    // Extract userId (required)
    const userId = searchParams.get("userId");
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // TODO: Replace userId from query params with authenticated user from Shibboleth

    // Extract QR code options
    const options: QRCodeOptions = {
      format: (searchParams.get("format") as "svg" | "png" | "dataUrl") || "svg",
      size: searchParams.get("size") ? parseInt(searchParams.get("size")!) : undefined,
      margin: searchParams.get("margin") ? parseInt(searchParams.get("margin")!) : undefined,
      darkColor: searchParams.get("darkColor") || undefined,
      lightColor: searchParams.get("lightColor") || undefined,
    };

    // 3. Validate QR options
    const validation = validateQROptions(options);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 4. Check rate limit (20 requests per minute)
    const isRateLimited = await checkRateLimit(
      qrCodeRateLimit(userId),
      QR_RATE_LIMIT_COUNT,
      QR_RATE_LIMIT_WINDOW_SECONDS
    );
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can generate up to 20 QR codes per minute." },
        { status: 429 }
      );
    }

    // 5. Fetch session from database
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        joinCode: true,
        createdById: true,
      },
    });

    // 6. Verify session exists
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // 7. Verify user is session creator
    if (session.createdById !== userId) {
      return NextResponse.json(
        { error: "Only the session creator can generate QR codes." },
        { status: 403 }
      );
    }

    // 8. Generate QR code (with caching)
    const qrCode = await generateSessionJoinQR(sessionId, session.joinCode, options);

    // 9. Determine Content-Type based on format
    const format = options.format || "svg";
    let contentType: string;
    let responseBody: string | Buffer;

    if (format === "svg") {
      contentType = "image/svg+xml";
      responseBody = qrCode;
    } else if (format === "png") {
      contentType = "image/png";
      // QR code is base64 encoded, convert to buffer
      responseBody = Buffer.from(qrCode, "base64");
    } else if (format === "dataUrl") {
      contentType = "application/json";
      responseBody = JSON.stringify({ dataUrl: qrCode });
    } else {
      return NextResponse.json(
        { error: "Invalid QR code format." },
        { status: 400 }
      );
    }

    // 10. Return QR code with appropriate headers
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // 1 hour client-side cache
      },
    });
  } catch (error) {
    console.error("[QR API] Failed to generate QR code:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the QR code." },
      { status: 500 }
    );
  }
}
