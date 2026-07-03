import webpush from "web-push";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/**
 * Web Push (VAPID) integration. Fans a notification out to every browser/PWA
 * subscription a user has registered, pruning dead endpoints as it goes.
 *
 * Push is a best-effort channel — it's a no-op (logged) when VAPID keys aren't
 * configured, so the rest of the notification pipeline still works via SMS.
 */

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:admin@wewash.app",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Send a push to all of a user's subscriptions. Returns count delivered. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) {
    logger.debug({ userId }, "Web push skipped — VAPID keys not configured");
    return 0;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        delivered++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          dead.push(sub.id); // Subscription expired/unsubscribed
        } else {
          logger.warn({ err, endpoint: sub.endpoint }, "Web push send failed");
        }
      }
    })
  );

  if (dead.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  }
  return delivered;
}

/** Send a push to many users concurrently. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  const counts = await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
  return counts.reduce((a, b) => a + b, 0);
}
