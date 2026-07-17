import { prisma } from "@/lib/db/prisma";
import { normalizeGhanaPhone, toLocalFormat } from "@/lib/utils/phone";

const OPERATOR_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

/**
 * Common storage variants for a Ghana number so lookups succeed whether
 * the DB has +233…, 233…, or 0… formats on `phone` / `phoneNumber`.
 */
export function phoneLookupVariants(raw: string): string[] {
  const e164 = normalizeGhanaPhone(raw);
  const noPlus = e164.replace(/^\+/, "");
  const local = toLocalFormat(e164);
  const trimmed = raw.replace(/[\s\-()]/g, "");
  return Array.from(new Set([e164, noPlus, local, trimmed].filter(Boolean)));
}

/**
 * Find an active admin/operator by phone before spending SMS.
 * Returns null when format is valid but no operator account matches.
 */
export async function findActiveOperatorByPhone(raw: string) {
  let variants: string[];
  try {
    variants = phoneLookupVariants(raw);
  } catch {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      isActive: true,
      role: { in: [...OPERATOR_ROLES] },
      OR: [
        { phoneNumber: { in: variants } },
        { phone: { in: variants } },
      ],
    },
    select: {
      id: true,
      email: true,
      role: true,
      phone: true,
      phoneNumber: true,
      isActive: true,
    },
  });
}

/**
 * Prefer E.164 on phoneNumber for Better Auth plugin lookups going forward.
 * No-op if already set or update fails (unique conflict, etc.).
 */
export async function ensureOperatorPhoneNumberCanonical(
  userId: string,
  raw: string
): Promise<string> {
  const e164 = normalizeGhanaPhone(raw);
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: e164,
        // Keep domain field in sync when empty
        phone: e164,
      },
    });
  } catch {
    // Unique conflict or concurrent update — ignore
  }
  return e164;
}
