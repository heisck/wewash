import { Queue, QueueEvents } from "bullmq";
import { env } from "@/lib/config/env";
import { normalizeRedisUrl } from "@/lib/db/redis";

const redisUrl = normalizeRedisUrl(env.REDIS_URL);

const connection = {
  url: redisUrl,
  // Recommended settings for BullMQ
  maxRetriesPerRequest: null as null,
  // Upstash requires TLS (rediss://)
  ...(redisUrl.startsWith("rediss://")
    ? { tls: { rejectUnauthorized: true } }
    : {}),
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
