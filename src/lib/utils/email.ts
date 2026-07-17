/**
 * Practical email check for inline form UX (not full RFC 5322).
 * Empty → "required"; present but malformed → "valid address" message.
 */
export function getEmailError(value: string): string | null {
  const email = value.trim();
  if (!email) return "Email is required.";
  // local@domain.tld — rejects obvious typos like "a@", "a@b", spaces
  const ok =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) &&
    !email.includes("..") &&
    email.length <= 254;
  if (!ok) return "Enter a valid email address.";
  return null;
}

export function isValidEmail(value: string): boolean {
  return getEmailError(value) === null;
}
