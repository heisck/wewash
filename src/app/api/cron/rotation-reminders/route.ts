import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertCron } from "@/lib/cron/guard";
import { notificationService } from "@/lib/services/notification.service";
import { nextOccurrence } from "@/lib/services/rotation.service";
import { money, isPaidInFull, sumCompletedPaidThisWeek } from "@/lib/services/weekly-dues";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Paid-in-full this week (sum COMPLETED >= weeklyAmount) get free PWA push at
 * 24h / 12h / 6h. Everyone still gets one SMS ~2 hours before handoff.
 */
const PUSH_WINDOWS_HOURS = [24, 12, 6] as const;
const SMS_WINDOW_HOURS = 2;

function inHourWindow(hoursUntil: number, target: number, halfWidth = 0.5): boolean {
  return hoursUntil > target - halfWidth && hoursUntil <= target + halfWidth;
}

export async function GET(req: NextRequest) {
  try {
    assertCron(req);
    const now = new Date();

    const schedules = await prisma.machineSchedule.findMany({
      where: { isActive: true },
      include: {
        room: {
          include: {
            hall: true,
            students: {
              where: { deletedAt: null, isActive: true },
              select: {
                id: true,
                userId: true,
                phone: true,
                firstName: true,
                weeklyAmount: true,
                user: { select: { notifySms: true } },
              },
            },
          },
        },
        machine: true,
      },
    });

    const allStudentIds = [
      ...new Set(schedules.flatMap((s) => s.room.students.map((st) => st.id))),
    ];
    const paidMap = await sumCompletedPaidThisWeek(allStudentIds, now);

    const counts = { push24: 0, push12: 0, push6: 0, sms2h: 0 };

    for (const s of schedules) {
      const turnAt = nextOccurrence(s.dayOfWeek, s.startTime, now);
      const hoursUntil = (turnAt.getTime() - now.getTime()) / 3_600_000;
      const students = s.room.students;
      if (students.length === 0) continue;

      const place = `Room ${s.room.number}${s.room.hall ? `, ${s.room.hall.code}` : ""}`;
      const timeLabel = s.startTime;

      // Early push only if paid in full this week (or free weeklyAmount = 0)
      const pushEligible = students.filter((st) => {
        if (!st.userId) return false;
        const due = money(st.weeklyAmount);
        const paid = paidMap.get(st.id) ?? 0;
        return isPaidInFull(paid, due);
      });

      for (const window of PUSH_WINDOWS_HOURS) {
        if (!inHourWindow(hoursUntil, window) || pushEligible.length === 0) continue;

        const title =
          window === 24
            ? "Washing day tomorrow"
            : window === 12
              ? "Machine in 12 hours"
              : "Machine in 6 hours";
        const body =
          window === 24
            ? `Your turn is tomorrow at ${timeLabel} — ${place}.`
            : `Your turn is at ${timeLabel} — ${place}. Open WeWash to prepare.`;

        await notificationService.notify({
          userIds: pushEligible.map((st) => st.userId!),
          title,
          body,
          url: "/student",
          channels: ["PUSH"],
        });

        if (window === 24) counts.push24 += pushEligible.length;
        if (window === 12) counts.push12 += pushEligible.length;
        if (window === 6) counts.push6 += pushEligible.length;
      }

      // Critical SMS ~2h — only students who keep SMS on (notifySms !== false)
      if (inHourWindow(hoursUntil, SMS_WINDOW_HOURS)) {
        const smsStudents = students.filter(
          (st) => st.phone && st.user?.notifySms !== false
        );
        const phones = [...new Set(smsStudents.map((st) => st.phone).filter(Boolean))];
        const pushIds = students
          .map((st) => st.userId)
          .filter((id): id is string => Boolean(id));
        if (phones.length || pushIds.length) {
          await notificationService.notify({
            phones,
            userIds: pushIds,
            title: "Machine arriving soon",
            body: `WeWash: machine reaches ${place} at ${timeLabel} (about 2 hours). Get laundry ready!`,
            url: "/student",
            channels: ["SMS", "PUSH"],
          });
          counts.sms2h += phones.length;
        }
      }
    }

    logger.info(counts, "Rotation reminders processed");
    return successResponse(counts);
  } catch (error) {
    return handleApiError(error);
  }
}
