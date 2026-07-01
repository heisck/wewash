import { Queue, QueueEvents } from "bullmq";
import { env } from "@/lib/config/env";

const connection = {
  url: env.REDIS_URL,
  // Recommended settings for BullMQ
  maxRetriesPerRequest: null,
};

// ─── Queue Definitions ───────────────────────────────────────

export const QUEUES = {
  SMS: "sms-notifications",
  EMAIL: "email-notifications",
  ROTATION: "machine-rotation",
} as const;

// ─── Queue Instances ─────────────────────────────────────────

export const smsQueue = new Queue(QUEUES.SMS, { connection });
export const emailQueue = new Queue(QUEUES.EMAIL, { connection });
export const rotationQueue = new Queue(QUEUES.ROTATION, { connection });

// ─── Queue Events (For global monitoring) ────────────────────

export const smsQueueEvents = new QueueEvents(QUEUES.SMS, { connection });
export const emailQueueEvents = new QueueEvents(QUEUES.EMAIL, { connection });
export const rotationQueueEvents = new QueueEvents(QUEUES.ROTATION, { connection });
