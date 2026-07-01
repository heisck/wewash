// ─── Application Constants ────────────────────────────────────

export const APP_NAME = "WeWash";
export const APP_VERSION = "0.1.0";

// ─── Pagination ───────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ─── Rate Limiting ────────────────────────────────────────────
// All values in requests per window (window = 60 seconds)

export const RATE_LIMITS = {
  AUTH: { max: 5, windowMs: 60_000 },       // 5 req/min for login/register
  OTP: { max: 3, windowMs: 60_000 },        // 3 req/min for OTP send
  READ: { max: 100, windowMs: 60_000 },     // 100 req/min for GET
  WRITE: { max: 30, windowMs: 60_000 },     // 30 req/min for POST/PUT/DELETE
  BULK: { max: 10, windowMs: 60_000 },      // 10 req/min for bulk ops
  UPLOAD: { max: 20, windowMs: 60_000 },    // 20 req/min for file uploads
} as const;

// ─── Retry Policy ─────────────────────────────────────────────

export const RETRY_POLICY = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1_000,
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY_MS: 10_000,
  REQUEST_TIMEOUT_MS: 15_000,
} as const;

// ─── Arkesel ──────────────────────────────────────────────────

export const ARKESEL = {
  API_VERSION: "v2",
  ENDPOINTS: {
    SEND_SMS: "/api/v2/sms/send",
    SEND_TEMPLATE_SMS: "/api/v2/sms/template/send",
    SEND_OTP: "/api/v2/otp/send",
    VERIFY_OTP: "/api/v2/otp/verify",
    CHECK_BALANCE: "/api/v2/sms/balance",
  },
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
    TYPE: "numeric" as const,
    MEDIUM: "sms" as const,
  },
  STATUS_CODES: {
    // SMS
    SUCCESS: "200",
    AUTH_FAILED: "401",
    INSUFFICIENT_BALANCE: "402",
    INACTIVE_GATEWAY: "403",
    VALIDATION_ERROR: "422",
    INTERNAL_ERROR: "500",
    // OTP Send
    OTP_SUCCESS: "1000",
    OTP_VALIDATION: "1001",
    OTP_MISSING_SLOT: "1002",
    OTP_SENDER_BLOCKED: "1003",
    OTP_GATEWAY_INACTIVE: "1004",
    OTP_INVALID_PHONE: "1005",
    OTP_NOT_ALLOWED: "1006",
    OTP_NO_BALANCE: "1007",
    OTP_INTERNAL: "1011",
    // OTP Verify
    OTP_VERIFIED: "1100",
    OTP_VERIFY_VALIDATION: "1101",
    OTP_VERIFY_INVALID_PHONE: "1102",
    OTP_VERIFY_INVALID_CODE: "1104",
    OTP_VERIFY_EXPIRED: "1105",
    OTP_VERIFY_INTERNAL: "1106",
  },
} as const;

// ─── Machine Schedule ─────────────────────────────────────────

export const MACHINE_SCHEDULE = {
  MAX_ROOMS_PER_MACHINE: 7,
  DEFAULT_START_TIME: "08:00",
  DEFAULT_END_TIME: "08:00", // Next day
} as const;

// ─── Notifications ────────────────────────────────────────────

export const NOTIFICATION = {
  MAX_RETRIES: 3,
  SMS_TEMPLATES: {
    MACHINE_ASSIGNED:
      "Hi {{name}}, your washing machine (SN: {{serial}}) is available today in {{hall}}, Room {{room}}.",
    PAYMENT_RECEIVED:
      "Payment of GHS {{amount}} received for {{period}}. Thank you! - WeWash",
    PAYMENT_REMINDER:
      "Reminder: Your washing machine payment of GHS {{amount}} is due on {{date}}. - WeWash",
    FAULT_REPORTED:
      "Fault report #{{id}} for machine {{serial}} has been logged. We'll attend to it shortly. - WeWash",
    FAULT_RESOLVED:
      "Good news! Fault #{{id}} for machine {{serial}} has been resolved. - WeWash",
    MACHINE_TRANSFER:
      "Machine {{serial}} has been transferred from {{from}} to {{to}}. - WeWash",
    CONTRACT_EXPIRY:
      "Your washing machine contract expires on {{date}}. Please contact admin to renew. - WeWash",
    ROTATION_REMINDER:
      "Hi {{name}}, it's your turn to use the washing machine today! Room {{room}}, {{hall}}. - WeWash",
    OTP_MESSAGE:
      "Your WeWash verification code is %otp_code%. It expires in {{expiry}} minutes.",
  },
} as const;

// ─── Cache TTL (seconds) ─────────────────────────────────────

export const CACHE_TTL = {
  SHORT: 60,            // 1 minute
  MEDIUM: 300,          // 5 minutes
  LONG: 1_800,          // 30 minutes
  VERY_LONG: 3_600,     // 1 hour
  SESSION: 86_400,      // 24 hours
  RATE_LIMIT: 60,       // 1 minute window
} as const;

// ─── File Upload ──────────────────────────────────────────────

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf"],
  MAX_IMAGES_PER_FAULT: 5,
} as const;

// ─── Ghana Phone ──────────────────────────────────────────────

export const GHANA_PHONE = {
  COUNTRY_CODE: "+233",
  REGEX: /^(\+233|0)(2[0-9]|5[0-9]|3[0-9])\d{7}$/,
} as const;
