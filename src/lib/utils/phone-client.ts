/**
 * Client-safe Ghana phone normalizer that returns null instead of throwing.
 * Handles the login/signup inputs where the "+233" prefix is shown separately,
 * so the raw value may be a 9-digit local number without a leading 0.
 *
 *   "0241234567"    → "+233241234567"
 *   "241234567"     → "+233241234567"
 *   "24 123 4567"   → "+233241234567"
 *   "+233241234567" → "+233241234567"
 */
export function toE164Ghana(input: string): string | null {
  let cleaned = input.replace(/[\s\-()]/g, "");
  if (!cleaned) return null;

  if (cleaned.startsWith("+233")) {
    // already international
  } else if (cleaned.startsWith("233")) {
    cleaned = "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    cleaned = "+233" + cleaned.slice(1);
  } else {
    cleaned = "+233" + cleaned;
  }

  // +233 followed by 9 digits, first of which is a valid mobile prefix (2/5/3)
  if (!/^\+233[235]\d{8}$/.test(cleaned)) return null;
  return cleaned;
}
