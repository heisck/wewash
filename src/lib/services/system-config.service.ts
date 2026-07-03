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

export type ContactConfig = { whatsapp: string; email: string; phone: string };

const CONTACT_KEYS = {
  whatsapp: "contact.whatsapp",
  email: "contact.email",
  phone: "contact.phone",
} as const;

export class SystemConfigService {
  /** Public contact info (no auth). DB value wins; otherwise env fallback. */
  async getContact(): Promise<ContactConfig> {
    const rows = await prisma.systemConfig.findMany({
      where: { key: { in: Object.values(CONTACT_KEYS) } },
    });
    const map = new Map(rows.map((r) => [r.key, String(r.value ?? "")]));
    return {
      whatsapp: map.get(CONTACT_KEYS.whatsapp) || env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      email: map.get(CONTACT_KEYS.email) || env.NEXT_PUBLIC_CONTACT_EMAIL || "",
      phone: map.get(CONTACT_KEYS.phone) || env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    };
  }

  /** Admin: read a config group (defaults to contact). */
  async getConfig(user: User | null, group = "contact") {
    requirePermission(user, "system_config", "read");
    const rows = await prisma.systemConfig.findMany({ where: { group } });
    return rows.map((r) => ({ key: r.key, value: r.value, label: r.label, group: r.group }));
  }

  /** Admin: upsert contact settings. */
  async updateContact(user: User | null, data: Partial<ContactConfig>) {
    requirePermission(user, "system_config", "update");

    const entries: { key: string; value: string; label: string }[] = [];
    if (data.whatsapp !== undefined)
      entries.push({ key: CONTACT_KEYS.whatsapp, value: data.whatsapp, label: "WhatsApp number" });
    if (data.email !== undefined)
      entries.push({ key: CONTACT_KEYS.email, value: data.email, label: "Contact email" });
    if (data.phone !== undefined)
      entries.push({ key: CONTACT_KEYS.phone, value: data.phone, label: "Contact phone" });

    for (const e of entries) {
      await prisma.systemConfig.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value, group: "contact", label: e.label },
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
