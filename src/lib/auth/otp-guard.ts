import { AUTH_OTP } from "@/lib/config/constants";
import { redis } from "@/lib/db/redis";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

const guardLogger = logger.child({ service: "otp-guard" });

/**
 * Pro-style OTP send protection (per destination):
 * 1. Resend cooldown — block spam of "Send code" (default 60s)
 * 2. Hourly cap — limit how many codes a target can request (default 5/hour)
 *
 * Fail-open if Redis is down so auth is not hard-blocked offline.
 */
export async function assertOtpSendAllowed(
  channel: "phone" | "email",
  destination: string
): Promise<void> {
  const normalized = destination.trim().toLowerCase();
  if (!normalized) {
    throw new AppError(ErrorCode.BAD_REQUEST, "Missing OTP destination");
  }

  const cooldownKey = `otp:cooldown:${channel}:${normalized}`;
  const hourlyKey = `otp:hourly:${channel}:${normalized}`;

  try {
    const coolTtl = await redis.ttl(cooldownKey);
    if (coolTtl > 0) {
      const mins = Math.floor(coolTtl / 60);
      const secs = coolTtl % 60;
      const waitLabel =
        mins > 0
          ? `${mins}m ${String(secs).padStart(2, "0")}s`
          : `${secs}s`;
      throw new AppError(
        ErrorCode.OTP_RATE_LIMITED,
        `Please wait ${waitLabel} before requesting another code.`,
        { details: { retryAfterSeconds: coolTtl } }
      );
    }

    const hourCount = Number((await redis.get(hourlyKey)) ?? "0");
    if (hourCount >= AUTH_OTP.MAX_SENDS_PER_HOUR) {
      const hourTtl = await redis.ttl(hourlyKey);
      const wait = hourTtl > 0 ? hourTtl : 3600;
      throw new AppError(
        ErrorCode.OTP_RATE_LIMITED,
        `Too many codes sent. Try again in ${Math.ceil(wait / 60)} minute(s).`,
        { details: { retryAfterSeconds: wait } }
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    guardLogger.warn({ err: error }, "OTP guard check failed — allowing send");
  }
}

/**
 * Call after a successful OTP send to start cooldown + increment hourly counter.
 */
export async function recordOtpSend(
  channel: "phone" | "email",
  destination: string
): Promise<void> {
  const normalized = destination.trim().toLowerCase();
  if (!normalized) return;

  const cooldownKey = `otp:cooldown:${channel}:${normalized}`;
  const hourlyKey = `otp:hourly:${channel}:${normalized}`;

  try {
    await redis.set(cooldownKey, "1", "EX", AUTH_OTP.RESEND_COOLDOWN_SECONDS);
    const count = await redis.incr(hourlyKey);
    if (count === 1) {
      await redis.expire(hourlyKey, 3600);
    }
  } catch (error) {
    guardLogger.warn({ err: error }, "OTP guard record failed");
  }
}
