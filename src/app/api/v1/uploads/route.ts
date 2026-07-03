import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { uploadBuffer } from "@/lib/integrations/cloudinary";
import { FILE_UPLOAD } from "@/lib/config/constants";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

export const runtime = "nodejs";

/**
 * POST /api/v1/uploads — multipart file upload to Cloudinary (fault photos,
 * receipts, avatars). Returns the hosted URL. Requires an authenticated user.
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string) || "wewash";

    if (!(file instanceof File)) throw AppError.badRequest("No file provided");

    const allowed: string[] = [
      ...FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES,
    ];
    if (!allowed.includes(file.type)) {
      throw AppError.badRequest(`Unsupported file type: ${file.type}`);
    }
    if (file.size > FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024) {
      throw AppError.badRequest(`File exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadBuffer(buffer, {
      folder: `wewash/${folder}`,
      mimetype: file.type,
    });

    return successResponse({ url, publicId });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("UPLOAD", postHandler);
