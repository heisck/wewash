import { NextRequest } from "next/server";
import type { DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { assertCron } from "@/lib/cron/guard";
import { notificationService } from "@/lib/services/notification.service";
import {
  isTwoDaysBeforeWeekEnd,
  rotationDayPassed,
} from "@/lib/utils/week";
import {
  money,
  remainingDues,
  isPaidInFull,
  sumCompletedPaidThisWeek,
} from "@/lib/services/weekly-dues";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Daily reminders. Pay nudges only for students who have NOT paid in full
 * this Mon–Sun week (sum of COMPLETED pieces < assigned weeklyAmount).
 */
export async function GET(req: NextRequest) {
  try {
    assertCron(req);
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    const expiringContracts = await prisma.contract.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: inSevenDays }, deletedAt: null },
      include: { student: true, machine: true },
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
        body: `Hi ${p.student.firstName}, a payment claim is still pending review. Or pay any remaining weekly dues in the app.`,
        url: "/student/billing",
      });
    }

    const students = await prisma.student.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        weeklyAmount: { gt: 0 },
      },
      select: {
        id: true,
        firstName: true,
        phone: true,
        userId: true,
        weeklyAmount: true,
        user: { select: { notifySms: true, id: true } },
        room: {
          select: {
            machineSchedules: {
              where: { isActive: true },
              select: { dayOfWeek: true },
            },
          },
        },
      },
    });

    const paidMap = await sumCompletedPaidThisWeek(
      students.map((s) => s.id),
      now
    );

    let pushPayNudges = 0;
    let fridaySms = 0;
    let notFullyPaid = 0;
    const friday = isTwoDaysBeforeWeekEnd(now);

    for (const s of students) {
      const due = money(s.weeklyAmount);
      const paid = paidMap.get(s.id) ?? 0;
      if (isPaidInFull(paid, due)) continue;

      notFullyPaid += 1;
      const left = remainingDues(paid, due);
      const days = (s.room?.machineSchedules ?? []).map((ms) => ms.dayOfWeek as DayOfWeek);
      const afterRotation = rotationDayPassed(days, now);
      const userIds = s.userId ? [s.userId] : [];
      const allowSms = s.user?.notifySms !== false;

      // After wash day this week — PWA only (not fully paid)
      if (afterRotation && userIds.length) {
        await notificationService.notify({
          userIds,
          title: "Complete this week's WeWash dues",
          body:
            paid > 0
              ? `Hi ${s.firstName}, GHS ${paid} confirmed — GHS ${left} left this week (fee GHS ${due}). Pay the rest when you can.`
              : `Hi ${s.firstName}, please pay GHS ${due} this week (Mon–Sun). You can pay in pieces and upload each proof.`,
          url: "/student/billing",
          channels: ["PUSH"],
        });
        pushPayNudges += 1;
      }

      // Friday SMS — only if still short of full weekly fee
      if (friday && allowSms && s.phone) {
        await notificationService.notify({
          phones: [s.phone],
          userIds,
          title: "WeWash payment reminder",
          body:
            paid > 0
              ? `Hi ${s.firstName}, 2 days left this week. GHS ${left} remaining of GHS ${due}. Upload proof in the app. - WeWash`
              : `Hi ${s.firstName}, 2 days left this week to pay GHS ${due}. Pay off-app and upload proof. - WeWash`,
          url: "/student/billing",
          channels: ["SMS"],
        });
        fridaySms += 1;
      }
    }

    const summary = {
      expiring: expiringContracts.length,
      overdue: overduePayments.length,
      pushPayNudges,
      fridaySms,
      notFullyPaidThisWeek: notFullyPaid,
    };
    logger.info(summary, "Reminders processed");
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
