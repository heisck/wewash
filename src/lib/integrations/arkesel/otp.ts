import { ARKESEL } from "@/lib/config/constants";
import { getArkeselClient, ArkeselApiError } from "./client";
import { normalizeGhanaPhone } from "@/lib/utils/phone";
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
 * Send a one-time password (OTP) to a phone number via Arkesel.
 *
 * Arkesel handles OTP generation, delivery, and expiry automatically.
 * The message MUST contain `%otp_code%` — Arkesel replaces it with the generated code.
 *
 * @param phoneNumber - Ghana phone number
 * @param options - Custom OTP settings (length, expiry, message)
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
  const normalizedPhone = normalizeGhanaPhone(phoneNumber);

  const payload: ArkeselSendOtpRequest = {
    expiry: options?.expiryMinutes ?? ARKESEL.OTP.EXPIRY_MINUTES,
    length: options?.length ?? ARKESEL.OTP.LENGTH,
    medium: ARKESEL.OTP.MEDIUM,
    message:
      options?.message ??
      `Your WeWash verification code is %otp_code%. It expires in ${options?.expiryMinutes ?? ARKESEL.OTP.EXPIRY_MINUTES} minutes.`,
    number: normalizedPhone,
    sender_id: client.senderId,
    type: ARKESEL.OTP.TYPE,
  };

  try {
    const response = await client.request<ArkeselSendOtpResponse>(
      ARKESEL.ENDPOINTS.SEND_OTP,
      { body: payload }
    );

    // Check Arkesel OTP-specific status codes
    if (response.code !== ARKESEL.STATUS_CODES.OTP_SUCCESS) {
      otpLogger.error(
        { code: response.code, message: response.message, phone: normalizedPhone },
        "OTP send failed"
      );

      switch (response.code) {
        case ARKESEL.STATUS_CODES.OTP_INVALID_PHONE:
          throw new AppError(ErrorCode.SMS_INVALID_PHONE, "Invalid phone number");
        case ARKESEL.STATUS_CODES.OTP_NO_BALANCE:
          throw new AppError(ErrorCode.SMS_INSUFFICIENT_BALANCE, "Insufficient SMS balance");
        case ARKESEL.STATUS_CODES.OTP_GATEWAY_INACTIVE:
          throw new AppError(ErrorCode.SMS_GATEWAY_INACTIVE, "SMS gateway inactive");
        case ARKESEL.STATUS_CODES.OTP_SENDER_BLOCKED:
          throw new AppError(ErrorCode.OTP_SEND_FAILED, "Sender ID blocked by administrator");
        default:
          throw new AppError(ErrorCode.OTP_SEND_FAILED, response.message || "OTP send failed");
      }
    }

    otpLogger.info(
      { phone: normalizedPhone, code: response.code },
      "OTP sent successfully"
    );

    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      ErrorCode.OTP_SEND_FAILED,
      "Failed to send OTP",
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

/**
 * Verify an OTP code entered by the user.
 *
 * @param phoneNumber - The phone number the OTP was sent to
 * @param code - The OTP code to verify
 * @returns True if verified, throws on invalid/expired
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const client = getArkeselClient();
  const normalizedPhone = normalizeGhanaPhone(phoneNumber);

  const payload: ArkeselVerifyOtpRequest = {
    number: normalizedPhone,
    code,
  };

  try {
    const response = await client.request<ArkeselVerifyOtpResponse>(
      ARKESEL.ENDPOINTS.VERIFY_OTP,
      { body: payload, retries: 1 } // Don't retry OTP verification aggressively
    );

    // Check verification status codes
    switch (response.code) {
      case ARKESEL.STATUS_CODES.OTP_VERIFIED:
        otpLogger.info({ phone: normalizedPhone }, "OTP verified");
        return true;

      case ARKESEL.STATUS_CODES.OTP_VERIFY_INVALID_CODE:
        throw new AppError(ErrorCode.OTP_INVALID, "Invalid OTP code");

      case ARKESEL.STATUS_CODES.OTP_VERIFY_EXPIRED:
        throw new AppError(ErrorCode.OTP_EXPIRED, "OTP code has expired");

      case ARKESEL.STATUS_CODES.OTP_VERIFY_INVALID_PHONE:
        throw new AppError(ErrorCode.SMS_INVALID_PHONE, "Invalid phone number for OTP");

      default:
        throw new AppError(ErrorCode.OTP_INVALID, response.message || "OTP verification failed");
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      ErrorCode.OTP_INVALID,
      "Failed to verify OTP",
      { cause: error instanceof Error ? error : undefined }
    );
  }
}
