import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors";

/**
 * Cloudinary media storage. Used for fault-report photos, receipts, and
 * avatars. Configured lazily from env; throws a clear error if called without
 * credentials so the failure is obvious rather than silent.
 */

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw AppError.internal("Cloudinary is not configured (missing CLOUDINARY_* env vars)");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/** Upload a file buffer to Cloudinary, returning the secure URL. */
export async function uploadBuffer(
  buffer: Buffer,
  opts: { folder?: string; mimetype?: string } = {}
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const dataUri = `data:${opts.mimetype || "image/jpeg"};base64,${buffer.toString("base64")}`;
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: opts.folder || "wewash",
    resource_type: "auto",
  });
  return { url: res.secure_url, publicId: res.public_id };
}
