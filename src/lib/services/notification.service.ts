import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { env } from "@/lib/config/env";
import { sendSMS } from "@/lib/integrations/arkesel";
import { sendPushToUsers } from "@/lib/integrations/push";

/**
 * Unified notification pipeline. Persists NotificationLog rows and dispatches
 * over SMS (Arkesel) and Web Push (VAPID). Designed to run inline in serverless
 * routes and cron handlers — every send is best-effort and failures are logged
 * rather than thrown, so one bad channel never blocks the others.
 */

type Channel = "SMS" | "PUSH";

export type NotifyInput = {
  userIds?: string[]; // resolves to phones (SMS) + push subscriptions
  phones?: string[]; // extra raw phone numbers (SMS only)
  title: string;
  body: string;
  url?: string;
  channels?: Channel[]; // default: both
};

const notifLogger = logger.child({ service: "notifications" });

export class NotificationService {
  async notify(input: NotifyInput): Promise<{ sms: number; push: number }> {
    const channels = input.channels ?? ["SMS", "PUSH"];
    const userIds = [...new Set(input.userIds ?? [])];

    // Resolve phone numbers for the target users (User.phone or linked Student.phone).
    let phones = [...(input.phones ?? [])];
    if (channels.includes("SMS") && userIds.length) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { phone: true, student: { select: { phone: true } } },
      });
      for (const u of users) {
        const p = u.phone || u.student?.phone;
        if (p) phones.push(p);
      }
    }
    phones = [...new Set(phones.filter(Boolean))];

    let smsCount = 0;
    let pushCount = 0;

    // ── SMS ──
    if (channels.includes("SMS") && phones.length) {
      const message = `${input.title}\n${input.body}`;
      try {
        const res = await sendSMS(phones, message);
        smsCount = phones.length;
        await prisma.notificationLog.createMany({
          data: phones.map((recipient) => ({
            type: "SMS" as const,
            recipient,
            subject: input.title,
            message,
            status: "SENT" as const,
            provider: "arkesel",
            providerId: (res as { data?: { id?: string } })?.data?.id ?? null,
            sentAt: new Date(),
          })),
        });
      } catch (err) {
        notifLogger.warn({ err }, "SMS dispatch failed");
        await prisma.notificationLog.createMany({
          data: phones.map((recipient) => ({
            type: "SMS" as const,
            recipient,
            subject: input.title,
            message,
            status: "FAILED" as const,
            provider: "arkesel",
            errorMessage: (err as Error).message,
          })),
        });
      }
    }

    // ── Web Push ──
    if (channels.includes("PUSH") && userIds.length) {
      try {
        pushCount = await sendPushToUsers(userIds, {
          title: input.title,
          body: input.body,
          url: input.url,
        });
        if (pushCount > 0) {
          await prisma.notificationLog.createMany({
            data: userIds.map((recipient) => ({
              type: "PUSH" as const,
              recipient,
              subject: input.title,
              message: input.body,
              status: "SENT" as const,
              provider: "web-push",
              sentAt: new Date(),
            })),
          });
        }
      } catch (err) {
        notifLogger.warn({ err }, "Push dispatch failed");
      }
    }

    return { sms: smsCount, push: pushCount };
  }

  /** Notify all admins/super-admins (used for new fault reports, contact leads). */
  async notifyAdmins(title: string, body: string, url?: string) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });
    if (!admins.length) return { sms: 0, push: 0 };
    return this.notify({ userIds: admins.map((a) => a.id), title, body, url });
  }

  /** Send a student a welcome SMS with the app link + scan hint. */
  async sendWelcome(phone: string, firstName: string) {
    const link = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const message = `Hi ${firstName}, welcome to WeWash! Manage your washing rotation and scan your machine at ${link}. - WeWash`;
    try {
      await sendSMS([phone], message);
      await prisma.notificationLog.create({
        data: {
          type: "SMS",
          recipient: phone,
          subject: "Welcome to WeWash",
          message,
          status: "SENT",
          provider: "arkesel",
          sentAt: new Date(),
        },
      });
    } catch (err) {
      notifLogger.warn({ err, phone }, "Welcome SMS failed");
    }
  }
}

export const notificationService = new NotificationService();
