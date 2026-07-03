import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertCron } from "@/lib/cron/guard";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup — deletes expired sessions, prunes soft-deleted rows
 * older than 30 days, and expires stale wash sessions. Run daily via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  try {
    assertCron(req);
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [sessions, students, machines, halls, stale] = await Promise.all([
      prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.student.deleteMany({ where: { deletedAt: { lt: thirtyDaysAgo } } }),
      prisma.machine.deleteMany({ where: { deletedAt: { lt: thirtyDaysAgo } } }),
      prisma.hall.deleteMany({ where: { deletedAt: { lt: thirtyDaysAgo } } }),
      prisma.washSession.updateMany({
        where: { status: "IN_USE", dueBackAt: { lt: now } },
        data: { status: "EXPIRED" },
      }),
    ]);

    const result = {
      sessions: sessions.count,
      students: students.count,
      machines: machines.count,
      halls: halls.count,
      expiredWashSessions: stale.count,
    };
    logger.info(result, "Cleanup completed");
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
