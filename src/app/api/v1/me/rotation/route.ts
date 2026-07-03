import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { getStudentRotation } from "@/lib/services/rotation.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

/**
 * GET /api/v1/me/rotation — the signed-in student's rotation status: when their
 * room's turn is, whether the machine is in their room now, and time to the next
 * handoff. Returns null if the student has no room/schedule yet.
 */
async function getHandler(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const rotation = await getStudentRotation(session.user.id);
    return successResponse(rotation);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
