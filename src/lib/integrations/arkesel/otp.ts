import { ARKESEL } from "@/lib/config/constants";
import { getArkeselClient } from "./client";
import { toArkeselPhone } from "@/lib/utils/phone";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  ArkeselSendOtpRequest,
  ArkeselSendOtpResponse,
  ArkeselVerifyOtpRequest,
  ArkeselVerifyOtpResponse,
} from "./types";

const otpLogger = logger.child({ service: "arkesel-otp" });

/**
 * Send OTP via Arkesel.
 *
 * Live API (verified 2026):
 *   POST https://sms.arkesel.com/api/otp/generate
 *   Header: api-key
 *   Body: number (233…), sender_id, message (%otp_code%), expiry, length, medium, type
 *
 * Success code: "1000"
 * Docs/troubleshooting: https://arkesel.com/troubleshooting-10-common-otp-api-integration-issues/
 */
export async function sendOTP(
  phoneNumber: string,
  options?: {
    length?: number;
    expiryMinutes?: number;
    message?: string;
  }
): Promise<ArkeselSendOtpResponse> {
  const client = getArkeselClient();
  const number = toArkeselPhone(phoneNumber);

  const payload: ArkeselSendOtpRequest = {
    expiry: options?.expiryMinutes ?? ARKESEL.OTP.EXPIRY_MINUTES,
    length: options?.length ?? ARKESEL.OTP.LENGTH,
    medium: ARKESEL.OTP.MEDIUM,
    message:
      options?.message ??
      `Your WeWash verification code is %otp_code%. It expires in ${options?.expiryMinutes ?? ARKESEL.OTP.EXPIRY_MINUTES} minutes.`,
    number,
    sender_id: client.senderId,
    type: ARKESEL.OTP.TYPE,
  };

  try {
    const response = await client.request<ArkeselSendOtpResponse>(
      ARKESEL.ENDPOINTS.SEND_OTP,
      { body: payload }
    );

    if (String(response.code) !== ARKESEL.STATUS_CODES.OTP_SUCCESS) {
      otpLogger.error(
        { code: response.code, message: response.message, phone: number },
        "OTP send failed"
      );

      switch (String(response.code)) {
        case ARKESEL.STATUS_CODES.OTP_INVALID_PHONE:
          throw new AppError(ErrorCode.SMS_INVALID_PHONE, "Invalid phone number");
        case ARKESEL.STATUS_CODES.OTP_NO_BALANCE:
          throw new AppError(
            ErrorCode.SMS_INSUFFICIENT_BALANCE,
            "Insufficient SMS balance"
          );
        case ARKESEL.STATUS_CODES.OTP_GATEWAY_INACTIVE:
          throw new AppError(
            ErrorCode.SMS_GATEWAY_INACTIVE,
            "SMS gateway inactive"
          );
        case ARKESEL.STATUS_CODES.OTP_SENDER_BLOCKED:
          throw new AppError(
            ErrorCode.OTP_SEND_FAILED,
            "Sender ID blocked by administrator"
          );
        default:
          throw new AppError(
            ErrorCode.OTP_SEND_FAILED,
            response.message || "OTP send failed"
          );
      }
    }

    otpLogger.info({ phone: number, code: response.code }, "OTP sent successfully");
    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(ErrorCode.OTP_SEND_FAILED, "Failed to send OTP", {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * Verify OTP via Arkesel.
 * POST https://sms.arkesel.com/api/otp/verify
 * Body: { number: "233…", code: "…" }
 * Success code: "1100"
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const client = getArkeselClient();
  const number = toArkeselPhone(phoneNumber);

  const payload: ArkeselVerifyOtpRequest = {
    number,
    code,
  };

  try {
    const response = await client.request<ArkeselVerifyOtpResponse>(
      ARKESEL.ENDPOINTS.VERIFY_OTP,
      { body: payload, retries: 1 }
    );

    switch (String(response.code)) {
      case ARKESEL.STATUS_CODES.OTP_VERIFIED:
        otpLogger.info({ phone: number }, "OTP verified");
        return true;

      case ARKESEL.STATUS_CODES.OTP_VERIFY_INVALID_CODE:
        throw new AppError(
          ErrorCode.OTP_INVALID,
          "Invalid OTP code. Check the digits and try again."
        );

      case ARKESEL.STATUS_CODES.OTP_VERIFY_EXPIRED:
        throw new AppError(
          ErrorCode.OTP_EXPIRED,
          "This code has expired. Request a new one."
        );

      case ARKESEL.STATUS_CODES.OTP_VERIFY_INVALID_PHONE:
        throw new AppError(
          ErrorCode.SMS_INVALID_PHONE,
          "Invalid phone number for OTP"
        );

      default:
        throw new AppError(
          ErrorCode.OTP_INVALID,
          response.message || "OTP verification failed"
        );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(ErrorCode.OTP_INVALID, "Failed to verify OTP", {
      cause: error instanceof Error ? error : undefined,
    });
  }
}
