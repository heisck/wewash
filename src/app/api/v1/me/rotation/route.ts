import { NextRequest } from "next/server";
import { getStudentRotation } from "@/lib/services/rotation.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";
import { requireAuth } from "@/lib/auth/require-auth";

/**
 * GET /api/v1/me/rotation — the signed-in student's rotation status.
 * Returns null if no room/schedule yet.
 */
async function getHandler(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const rotation = await getStudentRotation(user.id);
    return successResponse(rotation);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
