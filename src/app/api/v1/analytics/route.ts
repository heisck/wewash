import { NextRequest } from "next/server";
import { analyticsService } from "@/lib/services/analytics.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";
import { requireStaff } from "@/lib/auth/require-auth";

async function getHandler(_req: NextRequest) {
  try {
    const user = await requireStaff();
    const stats = await analyticsService.getDashboardStats(user);
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
