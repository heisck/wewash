import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { notificationService } from "@/lib/services/notification.service";
import { requirePermission } from "@/lib/auth/permissions";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

const notifySchema = z.object({
  target: z.enum(["all", "selected"]).default("selected"),
  studentIds: z.array(z.string()).optional(),
  phones: z.array(z.string()).optional(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  channels: z.array(z.enum(["SMS", "PUSH"])).optional(),
});

/**
 * POST /api/v1/notifications — admin broadcasts a notification (SMS + push) to
 * all students or a selected subset. Also accepts extra raw phone numbers.
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();
    requirePermission(session.user, "notifications", "create");

    const body = await req.json().catch(() => ({}));
    const input = notifySchema.parse(body);

    // Resolve targets. SMS uses student.phone even if no login user is linked;
    // push needs userId.
    const where =
      input.target === "all"
        ? { isActive: true, deletedAt: null }
        : { id: { in: input.studentIds ?? [] }, deletedAt: null };

    const students = await prisma.student.findMany({
      where,
      select: { id: true, userId: true, phone: true, firstName: true },
    });

    if (input.target === "selected" && (input.studentIds?.length ?? 0) > 0 && students.length === 0) {
      throw AppError.notFound("Student", input.studentIds?.[0]);
    }

    const userIds = students
      .map((s) => s.userId)
      .filter((id): id is string => Boolean(id));
    const studentPhones = students.map((s) => s.phone).filter(Boolean);

    const result = await notificationService.notify({
      userIds,
      phones: [...(input.phones ?? []), ...studentPhones],
      title: input.title,
      body: input.body,
      channels: input.channels,
    });

    if (result.sms === 0 && result.push === 0 && studentPhones.length === 0) {
      throw AppError.badRequest(
        "No phone number on file for this student — SMS cannot be sent."
      );
    }

    return successResponse({
      recipients: students.length,
      phones: studentPhones.length,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("WRITE", postHandler);
