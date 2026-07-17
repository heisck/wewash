import { ARKESEL } from "@/lib/config/constants";
import { getArkeselClient, ArkeselApiError } from "./client";
import { toArkeselPhone } from "@/lib/utils/phone";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  ArkeselSendSmsRequest,
  ArkeselSendSmsResponse,
  ArkeselSendTemplateSmsRequest,
  ArkeselSendTemplateSmsResponse,
} from "./types";

const smsLogger = logger.child({ service: "arkesel-sms" });

/**
 * Send an SMS to one or more recipients.
 *
 * @param recipients - Array of phone numbers (Ghana format)
 * @param message - SMS message text
 * @param options - Optional scheduling and webhook config
 */
export async function sendSMS(
  recipients: string[],
  message: string,
  options?: {
    scheduledDate?: string;  // "YYYY-MM-DD HH:MM AM/PM"
    callbackUrl?: string;
  }
): Promise<ArkeselSendSmsResponse> {
  const client = getArkeselClient();

  // Arkesel expects country code without "+" (e.g. 233…)
  const normalizedRecipients = recipients.map((phone) => {
    try {
      return toArkeselPhone(phone);
    } catch {
      smsLogger.warn({ phone }, "Invalid phone number, skipping");
      return null;
    }
  }).filter(Boolean) as string[];

  if (normalizedRecipients.length === 0) {
    throw new AppError(ErrorCode.SMS_INVALID_PHONE, "No valid phone numbers provided");
  }

  const payload: ArkeselSendSmsRequest = {
    sender: client.senderId,
    message,
    recipients: normalizedRecipients,
    ...(client.isSandbox ? { sandbox: true } : {}),
    ...(options?.scheduledDate ? { scheduled_date: options.scheduledDate } : {}),
    ...(options?.callbackUrl ? { callback_url: options.callbackUrl } : {}),
  };

  try {
    const response = await client.request<ArkeselSendSmsResponse>(
      ARKESEL.ENDPOINTS.SEND_SMS,
      { body: payload }
    );

    smsLogger.info(
      {
        recipientCount: normalizedRecipients.length,
        status: response.status,
        sandbox: client.isSandbox,
      },
      "SMS sent"
    );

    return response;
  } catch (error) {
    if (error instanceof ArkeselApiError) {
      // Map Arkesel-specific errors
      if (error.statusCode === 402) {
        throw new AppError(
          ErrorCode.SMS_INSUFFICIENT_BALANCE,
          "Insufficient SMS balance. Please top up your Arkesel account."
        );
      }
      if (error.statusCode === 403) {
        throw new AppError(
          ErrorCode.SMS_GATEWAY_INACTIVE,
          "SMS gateway is currently inactive."
        );
      }
    }
    throw new AppError(
      ErrorCode.SMS_SEND_FAILED,
      "Failed to send SMS",
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

/**
 * Send a personalized template SMS to multiple recipients.
 * Each recipient gets a customized message with their specific variables.
 *
 * @example
 * await sendTemplateSMS(
 *   "Hi <%name%>, your machine is in room <%room%>",
 *   {
 *     "+233241234567": { name: "Kwame", room: "101" },
 *     "+233201234567": { name: "Ama", room: "102" },
 *   }
 * );
 */
export async function sendTemplateSMS(
  message: string,
  recipientData: Record<string, Record<string, string>>,
  options?: {
    scheduledDate?: string;
    callbackUrl?: string;
  }
): Promise<ArkeselSendTemplateSmsResponse> {
  const client = getArkeselClient();

  // Normalize phone numbers in the recipient data (Arkesel: 233… no +)
  const normalizedData: Record<string, Record<string, string>> = {};
  for (const [phone, vars] of Object.entries(recipientData)) {
    try {
      const normalized = toArkeselPhone(phone);
      normalizedData[normalized] = vars;
    } catch {
      smsLogger.warn({ phone }, "Invalid phone number in template, skipping");
    }
  }

  if (Object.keys(normalizedData).length === 0) {
    throw new AppError(ErrorCode.SMS_INVALID_PHONE, "No valid phone numbers provided");
  }

  const payload: ArkeselSendTemplateSmsRequest = {
    sender: client.senderId,
    message,
    recipients: normalizedData,
    ...(options?.scheduledDate ? { scheduled_date: options.scheduledDate } : {}),
    ...(options?.callbackUrl ? { callback_url: options.callbackUrl } : {}),
  };

  try {
    return await client.request<ArkeselSendTemplateSmsResponse>(
      ARKESEL.ENDPOINTS.SEND_TEMPLATE_SMS,
      { body: payload }
    );
  } catch (error) {
    throw new AppError(
      ErrorCode.SMS_SEND_FAILED,
      "Failed to send template SMS",
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

/**
 * Check the SMS balance on the Arkesel account.
 */
export async function checkBalance(): Promise<{ balance: number; user: string }> {
  const client = getArkeselClient();

  const response = await client.request<{ balance: number; user: string }>(
    ARKESEL.ENDPOINTS.CHECK_BALANCE,
    { method: "GET", retries: 1 }
  );

  return response;
}
