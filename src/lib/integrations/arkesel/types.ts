/**
 * Arkesel API v2 TypeScript types.
 * Based on the official OpenAPI spec v2.3.1 at https://developers.arkesel.com
 */

// ─── SMS Types ──────────────────────────────────────────────

export interface ArkeselSendSmsRequest {
  sender: string;         // Max 11 chars — registered Sender ID
  message: string;
  recipients: string[];   // Array of phone numbers
  sandbox?: boolean;      // If true, SMS is not actually sent (free)
  scheduled_date?: string; // "YYYY-MM-DD HH:MM AM/PM" for scheduling
  callback_url?: string;  // Delivery webhook URL
}

export interface ArkeselSendSmsResponse {
  status: "success" | "error";
  data?: Array<{
    recipient: string;
    id: string;
  }>;
  message?: string; // Error or success message
}

// ─── Template SMS Types ─────────────────────────────────────

export interface ArkeselSendTemplateSmsRequest {
  sender: string;
  message: string; // Use <%variable%> for placeholders
  recipients: Record<string, Record<string, string>>; // { "phone": { "var1": "val1" } }
  scheduled_date?: string;
  callback_url?: string;
}

export interface ArkeselSendTemplateSmsResponse {
  status: "success" | "error";
  data?: Array<{
    recipient: string;
    id: string;
  }>;
  message?: string;
}

// ─── OTP Types ──────────────────────────────────────────────

export interface ArkeselSendOtpRequest {
  expiry: number;        // OTP expiry in minutes
  length: number;        // OTP length (4-8)
  medium: "sms" | "voice";
  message: string;       // Must contain %otp_code% placeholder
  number: string;        // Recipient phone number
  sender_id: string;
  type: "numeric" | "alphanumeric";
}

export interface ArkeselSendOtpResponse {
  code: string;   // "1000" = success
  message: string;
}

export interface ArkeselVerifyOtpRequest {
  number: string;
  code: string;
}

export interface ArkeselVerifyOtpResponse {
  code: string;   // "1100" = verified
  message: string;
}

// ─── Balance Types ──────────────────────────────────────────

export interface ArkeselBalanceResponse {
  balance: number;
  user: string;
  country: string;
}

// ─── Delivery Webhook ───────────────────────────────────────

export interface ArkeselDeliveryWebhook {
  id: string;
  recipient: string;
  status: "delivered" | "failed" | "rejected";
  delivered_at?: string;
}

// ─── Error Types ────────────────────────────────────────────

export interface ArkeselErrorResponse {
  status: "error";
  message: string;
}

// ─── Client Config ──────────────────────────────────────────

export interface ArkeselClientConfig {
  apiKey: string;
  baseUrl: string;
  senderId: string;
  sandbox: boolean;
  timeoutMs: number;
  maxRetries: number;
}
