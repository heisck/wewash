import { NextRequest } from "next/server";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Verify a cron request. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 *
 * - Production: CRON_SECRET is required; missing secret or bad bearer → 401.
 * - Development: allows unauthenticated hits so routes can be exercised locally
 *   when CRON_SECRET is empty; if set, still enforces it.
 */
export function assertCron(req: NextRequest): void {
  const isProd = env.NODE_ENV === "production";

  if (isProd && !env.CRON_SECRET) {
    logger.error("CRON_SECRET is not set in production — rejecting cron call");
    throw AppError.unauthorized("Cron is not configured");
  }

  if (!env.CRON_SECRET) {
    // Local dev without secret
    return;
  }

  const header = req.headers.get("authorization");
  if (header !== `Bearer ${env.CRON_SECRET}`) {
    throw AppError.unauthorized("Invalid cron secret");
  }
}
