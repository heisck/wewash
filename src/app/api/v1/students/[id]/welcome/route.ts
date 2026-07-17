import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { studentService } from "@/lib/services/student.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

/**
 * POST /api/v1/students/:id/welcome — resend welcome / login SMS.
 */
async function postHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    await studentService.resendWelcome(session?.user ?? null, id);
    return successResponse({ sent: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("WRITE", postHandler);
