import { Worker, Job } from "bullmq";
import { env } from "@/lib/config/env";
import { QUEUES, smsQueue } from "./queue";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const workerLogger = logger.child({ service: "report-worker" });

export const reportWorker = new Worker(
  QUEUES.ROTATION, // Reuse rotation queue for reports
  async (job: Job) => {
    workerLogger.debug({ jobId: job.id }, "Processing report generation");

    try {
      // Get some simple metrics
      const [totalStudents, totalMachines, faultyMachines, totalPayments] = await Promise.all([
        prisma.student.count({ where: { deletedAt: null, isActive: true } }),
        prisma.machine.count({ where: { deletedAt: null } }),
        prisma.machine.count({ where: { deletedAt: null, status: "FAULTY" } }),
        prisma.payment.aggregate({
          where: { status: "COMPLETED", deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

      const revenue = totalPayments._sum.amount?.toNumber() || 0;

      const reportSummary = `WeWash Weekly Report:
Active Students: ${totalStudents}
Total Machines: ${totalMachines} (Faulty: ${faultyMachines})
Total Revenue: GHS ${revenue.toFixed(2)}`;

      workerLogger.info({ reportSummary }, "System health metrics report generated");

      // Notify super admins by SMS if they exist
      const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN", isActive: true, phone: { not: null } },
      });

      for (const admin of superAdmins) {
        if (!admin.phone) continue;

        const log = await prisma.notificationLog.create({
          data: {
            type: "SMS",
            recipient: admin.phone,
            message: reportSummary,
            status: "PENDING",
          },
        });

        await smsQueue.add(`admin-report-${admin.id}-${Date.now()}`, {
          logId: log.id,
          type: "STANDARD",
          message: reportSummary,
          recipients: [admin.phone],
        });
      }
    } catch (error) {
      workerLogger.error({ jobId: job.id, error }, "Report worker failed");
      throw error;
    }
  },
  {
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
  }
);
