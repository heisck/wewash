import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { studentService } from "@/lib/services/student.service";
import { createdResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

const onboardingSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  phone: z.string().min(6),
  hallId: z.string().optional(),
  roomNumber: z.string().optional(),
});

/**
 * POST /api/v1/onboarding — the signed-in user creates their own student
 * profile, choosing a hostel the admin has created.
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const body = await req.json().catch(() => ({}));
    const data = onboardingSchema.parse(body);

    const student = await studentService.onboardSelf(session.user, data);
    return createdResponse(student);
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("WRITE", postHandler);
