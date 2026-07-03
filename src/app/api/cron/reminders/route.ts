import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertCron } from "@/lib/cron/guard";
import { notificationService } from "@/lib/services/notification.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reminders — contract-expiry (within 7 days) and overdue-payment
 * reminders. Run daily via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  try {
    assertCron(req);
    const now = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(now.getDate() + 7);

    const expiringContracts = await prisma.contract.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: inSevenDays }, deletedAt: null },
      include: { student: { include: { user: true } }, machine: true },
    });

    for (const c of expiringContracts) {
      await notificationService.notify({
        userIds: c.student.userId ? [c.student.userId] : [],
        phones: [c.student.phone],
        title: "Contract expiring soon",
        body: `Hi ${c.student.firstName}, your contract for machine ${c.machine.serialNumber} expires on ${c.endDate.toLocaleDateString()}. Please renew.`,
        url: "/student/billing",
      });
    }

    const overduePayments = await prisma.payment.findMany({
      where: { status: "PENDING", dueDate: { lte: now }, deletedAt: null },
      include: { student: true },
    });

    for (const p of overduePayments) {
      await notificationService.notify({
        userIds: p.student.userId ? [p.student.userId] : [],
        phones: [p.student.phone],
        title: "Payment due",
        body: `Hi ${p.student.firstName}, your payment of GHS ${p.amount} was due on ${p.dueDate?.toLocaleDateString()}. Please pay to keep access.`,
        url: "/student/billing",
      });
    }

    logger.info(
      { expiring: expiringContracts.length, overdue: overduePayments.length },
      "Reminders processed"
    );
    return successResponse({
      expiring: expiringContracts.length,
      overdue: overduePayments.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
