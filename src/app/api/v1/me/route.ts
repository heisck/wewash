import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { studentService } from "@/lib/services/student.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

/**
 * GET /api/v1/me — the signed-in user's identity + student profile (if any),
 * including room + hall. Used by the student portal shell and dashboard.
 */
async function getHandler(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const student = await studentService.getMyProfile(session.user);

    return successResponse({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role ?? "STUDENT",
        phone: (session.user as { phone?: string | null }).phone ?? null,
        image: session.user.image ?? null,
      },
      student,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
