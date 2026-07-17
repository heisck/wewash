import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { systemConfigService } from "@/lib/services/system-config.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

const contactSchema = z.object({
  whatsapp: z.string().max(20).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().max(20).optional(),
  defaultWeeklyAmount: z.coerce.number().min(0).max(100_000).optional(),
  rotationHandoffTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM")
    .optional(),
});

/** GET /api/v1/system-config?group=contact — admin reads a config group. */
async function getHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();
    const group = req.nextUrl.searchParams.get("group") ?? "contact";
    const config = await systemConfigService.getConfig(session.user, group);
    return successResponse(config);
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/v1/system-config — admin updates contact settings. */
async function putHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = contactSchema.parse(body);
    const contact = await systemConfigService.updateContact(session.user, data);
    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
export const PUT = withRateLimit("WRITE", putHandler);
