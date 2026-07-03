import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { successResponse, noContentResponse } from "@/lib/utils/api-response";
import { handleApiError, AppError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** POST /api/v1/push/subscribe — register/refresh this device's push subscription. */
async function postHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const body = await req.json().catch(() => ({}));
    const { endpoint, keys } = subSchema.parse(body);
    const userAgent = (await headers()).get("user-agent") ?? undefined;

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    return successResponse({ id: sub.id });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/v1/push/subscribe — remove this device's subscription. */
async function deleteHandler(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw AppError.unauthorized();

    const body = await req.json().catch(() => ({}));
    const endpoint = z.object({ endpoint: z.string() }).parse(body).endpoint;

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });
    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("WRITE", postHandler);
export const DELETE = withRateLimit("WRITE", deleteHandler);
