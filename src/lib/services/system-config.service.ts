import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/config/env";
import { User } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { auditLogService } from "./audit-log.service";

/**
 * Admin-editable key/value settings (SystemConfig). Currently powers the public
 * contact details (WhatsApp / email / phone) shown on the contact page, which
 * fall back to env defaults when unset.
 */

export type ContactConfig = {
  whatsapp: string;
  email: string;
  phone: string;
  defaultWeeklyAmount?: number;
  rotationHandoffTime?: string;
};

const CONTACT_KEYS = {
  whatsapp: "contact.whatsapp",
  email: "contact.email",
  phone: "contact.phone",
  defaultWeeklyAmount: "payments.defaultWeeklyAmount",
  rotationHandoffTime: "schedule.handoffTime",
} as const;

export class SystemConfigService {
  /** Public contact info (no auth). DB value wins; otherwise env fallback. */
  async getContact(): Promise<ContactConfig> {
    const rows = await prisma.systemConfig.findMany({
      where: { key: { in: Object.values(CONTACT_KEYS) } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const weeklyRaw = map.get(CONTACT_KEYS.defaultWeeklyAmount);
    const weekly =
      typeof weeklyRaw === "number"
        ? weeklyRaw
        : Number(weeklyRaw ?? 0) || undefined;
    return {
      whatsapp: String(map.get(CONTACT_KEYS.whatsapp) ?? "") || env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      email: String(map.get(CONTACT_KEYS.email) ?? "") || env.NEXT_PUBLIC_CONTACT_EMAIL || "",
      phone: String(map.get(CONTACT_KEYS.phone) ?? "") || env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      defaultWeeklyAmount: weekly,
      rotationHandoffTime:
        String(map.get(CONTACT_KEYS.rotationHandoffTime) ?? "") || "08:00",
    };
  }

  /** Admin: shaped contact + billing + schedule defaults (for Settings UI). */
  async getContactAdmin(user: User | null): Promise<ContactConfig> {
    requirePermission(user, "system_config", "read");
    return this.getContact();
  }

  /** Admin: read raw rows for a config group. */
  async getConfig(user: User | null, group = "contact") {
    requirePermission(user, "system_config", "read");
    const rows = await prisma.systemConfig.findMany({ where: { group } });
    return rows.map((r) => ({ key: r.key, value: r.value, label: r.label, group: r.group }));
  }

  /** Admin: upsert contact settings. */
  async updateContact(user: User | null, data: Partial<ContactConfig>) {
    requirePermission(user, "system_config", "update");

    const entries: { key: string; value: string | number; label: string; group: string }[] = [];
    if (data.whatsapp !== undefined)
      entries.push({ key: CONTACT_KEYS.whatsapp, value: data.whatsapp, label: "WhatsApp number", group: "contact" });
    if (data.email !== undefined)
      entries.push({ key: CONTACT_KEYS.email, value: data.email, label: "Contact email", group: "contact" });
    if (data.phone !== undefined)
      entries.push({ key: CONTACT_KEYS.phone, value: data.phone, label: "Contact phone", group: "contact" });
    if (data.defaultWeeklyAmount !== undefined)
      entries.push({
        key: CONTACT_KEYS.defaultWeeklyAmount,
        value: data.defaultWeeklyAmount,
        label: "Default weekly subscription (GHS)",
        group: "payments",
      });
    if (data.rotationHandoffTime !== undefined)
      entries.push({
        key: CONTACT_KEYS.rotationHandoffTime,
        value: data.rotationHandoffTime,
        label: "Default rotation handoff time",
        group: "schedule",
      });

    for (const e of entries) {
      await prisma.systemConfig.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value, group: e.group, label: e.label },
      });
    }

    await auditLogService.log({
      userId: user?.id ?? null,
      action: "UPDATE",
      entity: "SystemConfig",
      entityId: "contact",
      newValues: data,
    });

    return this.getContact();
  }
}

export const systemConfigService = new SystemConfigService();
