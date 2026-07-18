import { NextRequest } from "next/server";
import { financeService } from "@/lib/services/finance.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";
import { requireAuth } from "@/lib/auth/require-auth";

/**
 * GET /api/v1/me/dues — this week's weekly fee progress (pieces + paid-in-full).
 * Returns null when the login has no linked student profile.
 */
async function getHandler(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const dues = await financeService.getMyWeekDues(user);
    return successResponse(dues);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
