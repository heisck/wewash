import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { uploadBuffer } from "@/lib/integrations/cloudinary";
import { FILE_UPLOAD } from "@/lib/config/constants";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/** Only these Cloudinary subfolders may be written to. */
const ALLOWED_FOLDERS = new Set([
  "receipts",
  "faults",
  "avatars",
  "documents",
  "wewash",
]);

/** Magic-byte sniff for common image types (reject spoofed MIME). */
function sniffImage(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WebP: RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  // PDF
  if (buffer.toString("ascii", 0, 4) === "%PDF") {
    return "application/pdf";
  }
  return null;
}

/**
 * POST /api/v1/uploads — multipart upload to Cloudinary.
 * Auth required; folder allow-list; size + MIME + magic-byte checks.
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();
    if ((session.user as { isActive?: boolean }).isActive === false) {
      throw AppError.forbidden("This account has been deactivated.");
    }

    const form = await req.formData();
    const file = form.get("file");
    const rawFolder = String(form.get("folder") || "receipts")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 32);
    const folder = ALLOWED_FOLDERS.has(rawFolder) ? rawFolder : "receipts";

    if (!(file instanceof File)) throw AppError.badRequest("No file provided");

    const declaredType = file.type || "application/octet-stream";
    const allowed: string[] = [
      ...FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES,
    ];
    if (!allowed.includes(declaredType)) {
      throw AppError.badRequest(`Unsupported file type: ${declaredType}`);
    }
    if (file.size > FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024) {
      throw AppError.badRequest(
        `File exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit`
      );
    }
    if (file.size < 32) {
      throw AppError.badRequest("File is empty or too small");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImage(buffer);
    if (!sniffed || !allowed.includes(sniffed)) {
      throw AppError.badRequest(
        "File content does not match an allowed image or PDF type"
      );
    }
    // Declared type should agree with bytes (allow jpeg/jpg alias)
    if (sniffed !== declaredType) {
      logger.warn(
        {
          declaredType,
          sniffed,
          userId: session.user.id,
        },
        "Upload MIME mismatch — using sniffed type"
      );
    }

    const { url, publicId } = await uploadBuffer(buffer, {
      folder: `wewash/${folder}`,
      mimetype: sniffed,
    });

    return successResponse({ url, publicId, contentType: sniffed });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("UPLOAD", postHandler);
