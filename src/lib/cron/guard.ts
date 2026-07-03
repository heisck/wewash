import { NextRequest } from "next/server";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors";

/**
 * Verify a cron request. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * If CRON_SECRET is unset (local dev), the guard allows the request so routes can
 * be exercised manually — set it in production to lock cron down.
 */
export function assertCron(req: NextRequest): void {
  if (!env.CRON_SECRET) return; // dev / not configured
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${env.CRON_SECRET}`) {
    throw AppError.unauthorized("Invalid cron secret");
  }
}
