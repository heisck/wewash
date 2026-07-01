import { GHANA_PHONE } from "@/lib/config/constants";

/**
 * Normalize a Ghana phone number to international format (+233XXXXXXXXX).
 *
 * Accepts:
 *   "0241234567"    → "+233241234567"
 *   "233241234567"  → "+233241234567"
 *   "+233241234567" → "+233241234567"
 *
 * Throws if the number is invalid.
 */
export function normalizeGhanaPhone(phone: string): string {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // If starts with "0", replace with "+233"
  if (cleaned.startsWith("0")) {
    cleaned = GHANA_PHONE.COUNTRY_CODE + cleaned.slice(1);
  }

  // If starts with "233" (no +), add "+"
  if (cleaned.startsWith("233") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  // Validate the final format
  if (!isValidGhanaPhone(cleaned)) {
    throw new Error(`Invalid Ghana phone number: ${phone}`);
  }

  return cleaned;
}

/**
 * Validate a phone number matches Ghana format.
 */
export function isValidGhanaPhone(phone: string): boolean {
  return GHANA_PHONE.REGEX.test(phone);
}

/**
 * Format a phone number for display (e.g., "+233 24 123 4567").
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizeGhanaPhone(phone);
  // +233 XX XXX XXXX
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
}

/**
 * Strip the country code from a normalized phone number.
 * "+233241234567" → "0241234567"
 */
export function toLocalFormat(phone: string): string {
  const normalized = normalizeGhanaPhone(phone);
  return "0" + normalized.slice(4);
}
