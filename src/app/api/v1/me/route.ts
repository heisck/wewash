import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
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
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        notifySms: true,
        notifyEmail: true,
      },
    });

    return successResponse({
      user: {
        id: dbUser?.id ?? session.user.id,
        name: dbUser?.name ?? session.user.name,
        email: dbUser?.email ?? session.user.email,
        role: dbUser?.role ?? (session.user as { role?: string }).role ?? "STUDENT",
        phone: dbUser?.phone ?? null,
        image: dbUser?.image ?? session.user.image ?? null,
        notifySms: dbUser?.notifySms ?? true,
        notifyEmail: dbUser?.notifyEmail ?? false,
      },
      student,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  /** Admin/operator display name shown in the shell. */
  name: z.string().min(1).max(120).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(7).max(30).optional(),
  notifySms: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});

/** PATCH /api/v1/me — profile (name, phone, prefs). Admins and students. */
async function patchHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = patchSchema.parse(body);
    const result = await studentService.updateMySettings(session.user, data);
    return successResponse({
      user: {
        id: result.user!.id,
        name: result.user!.name,
        email: result.user!.email,
        role: result.user!.role,
        phone: result.user!.phone,
        image: result.user!.image,
        notifySms: result.user!.notifySms,
        notifyEmail: result.user!.notifyEmail,
      },
      student: result.student,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const PATCH = withRateLimit("WRITE", patchHandler);
