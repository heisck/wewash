import { Worker, Job } from "bullmq";
import { env } from "@/lib/config/env";
import { QUEUES, smsQueue } from "./queue";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const workerLogger = logger.child({ service: "reminder-worker" });

export const reminderWorker = new Worker(
  QUEUES.EMAIL, // Reuse email queue or change to another queue if needed
  async (job: Job) => {
    workerLogger.debug({ jobId: job.id }, "Processing reminders job");

    try {
      const now = new Date();
      const inSevenDays = new Date();
      inSevenDays.setDate(now.getDate() + 7);

      // 1. Contract Expiry Reminders
      const expiringContracts = await prisma.contract.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: inSevenDays },
          deletedAt: null,
        },
        include: { student: true, machine: true },
      });

      for (const contract of expiringContracts) {
        const message = `Hello ${contract.student.firstName}, your contract for machine ${contract.machine.serialNumber} is expiring on ${contract.endDate.toLocaleDateString()}. Please renew at WeWash.`;
        
        const log = await prisma.notificationLog.create({
          data: {
            type: "SMS",
            recipient: contract.student.phone,
            message,
            status: "PENDING",
          },
        });

        await smsQueue.add(`contract-expiry-${contract.id}`, {
          logId: log.id,
          type: "STANDARD",
          message,
          recipients: [contract.student.phone],
        });
      }

      // 2. Overdue Payment Reminders
      const overduePayments = await prisma.payment.findMany({
        where: {
          status: "PENDING",
          dueDate: { lte: now },
          deletedAt: null,
        },
        include: { student: true },
      });

      for (const payment of overduePayments) {
        const message = `Hello ${payment.student.firstName}, your payment of GHS ${payment.amount} was due on ${payment.dueDate?.toLocaleDateString()}. Please make payment to avoid access disruption.`;
        
        const log = await prisma.notificationLog.create({
          data: {
            type: "SMS",
            recipient: payment.student.phone,
            message,
            status: "PENDING",
          },
        });

        await smsQueue.add(`payment-overdue-${payment.id}`, {
          logId: log.id,
          type: "STANDARD",
          message,
          recipients: [payment.student.phone],
        });
      }

      workerLogger.info(
        { expiringCount: expiringContracts.length, overdueCount: overduePayments.length },
        "Reminders processed and queued successfully"
      );
    } catch (error) {
      workerLogger.error({ jobId: job.id, error }, "Reminder processing failed");
      throw error;
    }
  },
  {
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
  }
);
