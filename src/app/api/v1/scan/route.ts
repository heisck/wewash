import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { scanService } from "@/lib/services/scan.service";
import { successResponse, createdResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

const scanSchema = z
  .object({
    /** Student self-scan: opaque token from printed QR URL. */
    qrToken: z.string().min(1).optional(),
    /** Admin manual scan: claim machine for a student. */
    studentId: z.string().min(1).optional(),
    machineId: z.string().min(1).optional(),
    /** Student feedback while holding the machine */
    feedbackRating: z
      .enum(["frown", "meh", "smile", "heart", "star"])
      .optional(),
  })
  .superRefine((v, ctx) => {
    const selfScan = !!v.qrToken;
    const adminScan = !!v.studentId && !!v.machineId;
    const feedback = !!v.feedbackRating;
    if (!selfScan && !adminScan && !feedback) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide qrToken, studentId+machineId, or feedbackRating",
      });
    }
  });

/**
 * POST /api/v1/scan
 * - Student: { qrToken } from machine QR
 * - Admin: { studentId, machineId } manual claim for that student
 * - Student: { feedbackRating } rate active session
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const body = await req.json().catch(() => ({}));
    const input = scanSchema.parse(body);

    if (input.feedbackRating) {
      const result = await scanService.submitFeedback(
        session.user,
        input.feedbackRating
      );
      return successResponse(result);
    }

    if (input.qrToken) {
      const result = await scanService.scan(session.user, input.qrToken);
      return createdResponse(result);
    }

    const result = await scanService.adminScanForStudent(session.user, {
      studentId: input.studentId!,
      machineId: input.machineId!,
    });
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
