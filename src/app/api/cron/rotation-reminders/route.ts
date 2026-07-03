import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertCron } from "@/lib/cron/guard";
import { notificationService } from "@/lib/services/notification.service";
import { nextOccurrence } from "@/lib/services/rotation.service";
import { successResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/rotation-reminders
 * Reminds students when their room's washing turn is near — a day before, and
 * again within the last hour before handoff. Run this hourly via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  try {
    assertCron(req);
    const now = new Date();

    const schedules = await prisma.machineSchedule.findMany({
      where: { isActive: true },
      include: {
        room: { include: { hall: true, students: { where: { deletedAt: null, userId: { not: null } } } } },
        machine: true,
      },
    });

    let dayBefore = 0;
    let hourBefore = 0;

    for (const s of schedules) {
      const turnAt = nextOccurrence(s.dayOfWeek, s.startTime, now);
      const hoursUntil = (turnAt.getTime() - now.getTime()) / 3600000;
      const students = s.room.students;
      if (students.length === 0) continue;

      const userIds = students.map((st) => st.userId!).filter(Boolean);
      const phones = students.map((st) => st.phone);
      const place = `Room ${s.room.number}${s.room.hall ? `, ${s.room.hall.code}` : ""}`;

      // ~24h out (fire once per hourly run in the 23–24h window)
      if (hoursUntil > 23 && hoursUntil <= 24) {
        await notificationService.notify({
          userIds,
          phones,
          title: "Washing day tomorrow",
          body: `Your turn with the machine is tomorrow at ${s.startTime} — ${place}.`,
          url: "/student",
        });
        dayBefore += students.length;
      }

      // Final hour before handoff
      if (hoursUntil > 0 && hoursUntil <= 1) {
        await notificationService.notify({
          userIds,
          phones,
          title: "Machine arriving soon",
          body: `The machine reaches ${place} at ${s.startTime}. Get your laundry ready!`,
          url: "/student",
        });
        hourBefore += students.length;
      }
    }

    logger.info({ dayBefore, hourBefore }, "Rotation reminders processed");
    return successResponse({ dayBefore, hourBefore });
  } catch (error) {
    return handleApiError(error);
  }
}
