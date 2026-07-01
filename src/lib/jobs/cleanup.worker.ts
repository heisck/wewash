import { Worker, Job } from "bullmq";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const workerLogger = logger.child({ service: "cleanup-worker" });

export const cleanupWorker = new Worker(
  "cleanup-tasks",
  async (job: Job) => {
    workerLogger.debug({ jobId: job.id }, "Running system database cleanup");

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Delete expired auth sessions
      const deletedSessions = await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      // 2. Permanently delete soft deleted records older than 30 days
      const deletedStudents = await prisma.student.deleteMany({
        where: { deletedAt: { lt: thirtyDaysAgo } },
      });

      const deletedMachines = await prisma.machine.deleteMany({
        where: { deletedAt: { lt: thirtyDaysAgo } },
      });

      const deletedHalls = await prisma.hall.deleteMany({
        where: { deletedAt: { lt: thirtyDaysAgo } },
      });

      workerLogger.info(
        {
          deletedSessionsCount: deletedSessions.count,
          deletedStudentsCount: deletedStudents.count,
          deletedMachinesCount: deletedMachines.count,
          deletedHallsCount: deletedHalls.count,
        },
        "System database cleanup completed"
      );
    } catch (error) {
      workerLogger.error({ jobId: job.id, error }, "Cleanup worker failed");
      throw error;
    }
  },
  {
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
  }
);
