import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { analyticsService } from "@/lib/services/analytics.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

async function getHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const stats = await analyticsService.getDashboardStats(session?.user ?? null);
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
