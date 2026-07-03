import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { scanService } from "@/lib/services/scan.service";
import { successResponse, createdResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

const scanSchema = z.object({ qrToken: z.string().min(1) });

/** POST /api/v1/scan — record a machine scan → creates/returns a WashSession. */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const body = await req.json().catch(() => ({}));
    const { qrToken } = scanSchema.parse(body);

    const result = await scanService.scan(session.user, qrToken);
    return createdResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/** GET /api/v1/scan — the caller's current active wash session (or null). */
async function getHandler(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();
    const active = await scanService.getActiveSessionForUser(session.user);
    return successResponse(active);
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("WRITE", postHandler);
export const GET = withRateLimit("READ", getHandler);
