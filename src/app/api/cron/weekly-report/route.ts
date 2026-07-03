import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertCron } from "@/lib/cron/guard";
import { notificationService } from "@/lib/services/notification.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/weekly-report — sends admins a weekly operations summary. Run
 * weekly via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  try {
    assertCron(req);

    const [students, machines, faulty, payments, scans] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null, isActive: true } }),
      prisma.machine.count({ where: { deletedAt: null } }),
      prisma.machine.count({ where: { deletedAt: null, status: "FAULTY" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.washSession.count({
        where: { scannedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
    ]);

    const revenue = payments._sum.amount?.toNumber() ?? 0;
    const body = `Active students: ${students}\nMachines: ${machines} (faulty ${faulty})\nScans this week: ${scans}\nRevenue: GHS ${revenue.toFixed(2)}`;

    const result = await notificationService.notifyAdmins("WeWash weekly report", body, "/admin");

    logger.info({ students, machines, faulty, revenue, scans }, "Weekly report sent");
    return successResponse({ students, machines, faulty, revenue, scans, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
