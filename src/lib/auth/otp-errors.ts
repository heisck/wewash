/**
 * Map Better Auth / Arkesel OTP client errors to clear user-facing copy.
 * Distinguishes expired codes from wrong codes (and rate limits).
 */
export function otpErrorMessage(
  error: { code?: string | null; message?: string | null } | null | undefined,
  fallback = "Could not verify the code."
): string {
  if (!error) return fallback;

  const code = (error.code ?? "").toUpperCase();
  const message = (error.message ?? "").trim();
  const lower = message.toLowerCase();

  if (
    code === "OTP_EXPIRED" ||
    lower.includes("expired") ||
    lower.includes("expire")
  ) {
    return "This code has expired. Request a new one.";
  }

  if (
    code === "TOO_MANY_ATTEMPTS" ||
    lower.includes("too many attempts") ||
    lower.includes("attempt")
  ) {
    return "Too many wrong attempts. Request a new code.";
  }

  if (
    code === "OTP_RATE_LIMITED" ||
    code === "TOO_MANY_REQUESTS" ||
    lower.includes("wait") ||
    lower.includes("rate")
  ) {
    return message || "Please wait before requesting another code.";
  }

  if (
    code === "INVALID_OTP" ||
    code === "OTP_INVALID" ||
    lower.includes("invalid otp") ||
    lower === "invalid otp"
  ) {
    return "Invalid OTP code. Check the digits and try again.";
  }

  return message || fallback;
}
