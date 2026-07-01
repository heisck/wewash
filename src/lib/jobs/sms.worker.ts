import { Worker, Job } from "bullmq";
import { env } from "@/lib/config/env";
import { QUEUES } from "./queue";
import { sendSMS, sendTemplateSMS } from "@/lib/integrations/arkesel";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

interface SmsJobData {
  logId: string;
  type: "STANDARD" | "TEMPLATE";
  message: string;
  recipients: string[] | Record<string, Record<string, string>>;
}

const workerLogger = logger.child({ service: "sms-worker" });

/**
 * BullMQ Worker to process SMS jobs asynchronously.
 * Updates the NotificationLog in the database on success or failure.
 */
export const smsWorker = new Worker<SmsJobData>(
  QUEUES.SMS,
  async (job: Job<SmsJobData>) => {
    const { logId, type, message, recipients } = job.data;
    workerLogger.debug({ jobId: job.id, logId }, "Processing SMS job");

    try {
      // Mark log as IN_PROGRESS
      await prisma.notificationLog.update({
        where: { id: logId },
        data: { status: "RETRYING", nextRetryAt: null }, // Using RETRYING as "in progress" state
      });

      // Send SMS
      if (type === "TEMPLATE") {
        await sendTemplateSMS(
          message,
          recipients as Record<string, Record<string, string>>
        );
      } else {
        await sendSMS(recipients as string[], message);
      }

      // Mark log as SENT
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      workerLogger.info({ jobId: job.id, logId }, "SMS job completed successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      workerLogger.error({ jobId: job.id, logId, error: errorMessage }, "SMS job failed");

      // Mark log as FAILED
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: "FAILED",
          errorMessage,
          retryCount: { increment: 1 },
        },
      });

      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    concurrency: 5, // Process 5 SMS concurrently
  }
);

smsWorker.on("error", (err) => {
  workerLogger.error({ err }, "SMS Worker error");
});
