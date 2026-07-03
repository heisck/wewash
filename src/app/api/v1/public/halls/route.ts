import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { withRateLimit } from "@/lib/middleware/rate-limit.middleware";

/**
 * GET /api/v1/public/halls — unauthenticated list of active halls, used to
 * populate the hostel dropdown on the signup form. Only halls the admin has
 * created appear, which makes admin-added halls the yardstick for selection.
 */
async function getHandler(_req: NextRequest) {
  try {
    const halls = await prisma.hall.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
    return successResponse(halls);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("READ", getHandler);
