import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { AUTH_OTP } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import {
  sendOTP as arkeselSendOTP,
  sendSMS,
  verifyOTP as arkeselVerifyOTP,
} from "@/lib/integrations/arkesel";
import { sendOtpEmail } from "@/lib/email/otp-email";
import { normalizeGhanaPhone } from "@/lib/utils/phone";
import { logger } from "@/lib/logger";
import { assertOtpSendAllowed, recordOtpSend } from "@/lib/auth/otp-guard";
import {
  ensureOperatorPhoneNumberCanonical,
  findActiveOperatorByPhone,
} from "@/lib/auth/phone-user";
import { AppError, ErrorCode } from "@/lib/errors";

const authLogger = logger.child({ service: "better-auth" });

/** Phone SMS via Arkesel is capped at 1–10 minutes. */
const OTP_EXPIRY_MINUTES = Math.min(
  10,
  Math.max(1, Math.ceil(AUTH_OTP.EXPIRES_IN_SECONDS / 60))
);

/**
 * Better Auth server config (docs: https://www.better-auth.com/docs)
 *
 * - Email/password: sign-in enabled; public sign-up disabled (admins create students)
 * - Google OAuth: enabled only when GOOGLE_CLIENT_ID/SECRET are set
 * - Phone OTP: phoneNumber plugin + Arkesel (login + password reset SMS)
 * - Email OTP: Gmail SMTP (sign-in optional + password reset)
 * - OTP codes expire (default 5 min); verify attempts capped; resend cooldown + hourly cap
 * - nextCookies: required for Next.js App Router cookie/session handling
 * - Prisma adapter: users/sessions live in YOUR Postgres (Neon/etc.), not a separate Auth DB
 */
export const auth = betterAuth({
  appName: env.APP_NAME,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  trustedOrigins: Array.from(
    new Set(
      [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"].filter(
        Boolean
      ) as string[]
    )
  ),

  emailAndPassword: {
    enabled: true,
    // Students cannot self-register; admins provision accounts.
    disableSignUp: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            accessType: "offline" as const,
          },
        }
      : {}),
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Global path rate limits (auth abuse protection)
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      // 1 OTP send per 10 minutes (matches AUTH_OTP.RESEND_COOLDOWN_SECONDS)
      "/phone-number/send-otp": {
        window: AUTH_OTP.RESEND_COOLDOWN_SECONDS,
        max: 1,
      },
      "/phone-number/request-password-reset": {
        window: AUTH_OTP.RESEND_COOLDOWN_SECONDS,
        max: 1,
      },
      "/phone-number/reset-password": { window: 60, max: 5 },
      "/email-otp/send-verification-otp": {
        window: AUTH_OTP.RESEND_COOLDOWN_SECONDS,
        max: 1,
      },
      "/email-otp/request-password-reset": {
        window: AUTH_OTP.RESEND_COOLDOWN_SECONDS,
        max: 1,
      },
      "/email-otp/reset-password": { window: 60, max: 5 },
    },
  },

  plugins: [
    phoneNumber({
      otpLength: AUTH_OTP.LENGTH,
      expiresIn: AUTH_OTP.EXPIRES_IN_SECONDS,
      allowedAttempts: AUTH_OTP.ALLOWED_ATTEMPTS,
      /**
       * Format check only (Ghana E.164 / local). Account checks run in sendOTP
       * so we never bill Arkesel for random numbers.
       */
      phoneNumberValidator: async (raw) => {
        try {
          normalizeGhanaPhone(raw);
          return true;
        } catch {
          return false;
        }
      },
      /**
       * Login OTP: Arkesel generates & delivers (%otp_code%).
       * Before SMS: number must match an active ADMIN / SUPER_ADMIN.
       */
      sendOTP: async ({ phoneNumber: phone }) => {
        let normalized: string;
        try {
          normalized = normalizeGhanaPhone(phone);
        } catch {
          throw APIError.from("BAD_REQUEST", {
            code: "INVALID_PHONE_NUMBER",
            message:
              "Enter a valid Ghana mobile number (e.g. 0241234567 or +233241234567).",
          });
        }

        const operator = await findActiveOperatorByPhone(normalized);
        if (!operator) {
          authLogger.warn(
            { phone: normalized },
            "OTP send blocked — phone not linked to an active operator"
          );
          throw APIError.from("BAD_REQUEST", {
            code: "INVALID_PHONE_NUMBER",
            message:
              "This phone number is not registered for operator access. Check the number or use email/password.",
          });
        }

        // Canonical +233… on the user so verify / future logins match
        normalized = await ensureOperatorPhoneNumberCanonical(
          operator.id,
          normalized
        );

        await assertOtpSendAllowed("phone", normalized);
        try {
          await arkeselSendOTP(normalized, {
            expiryMinutes: OTP_EXPIRY_MINUTES,
            length: AUTH_OTP.LENGTH,
            message: `Your WeWash login code is %otp_code%. It expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it.`,
          });
          await recordOtpSend("phone", normalized);
          authLogger.info(
            { phone: normalized, userId: operator.id },
            "Phone login OTP sent via Arkesel"
          );
        } catch (error) {
          if (error instanceof AppError) throw error;
          throw error;
        }
      },
      verifyOTP: async ({ phoneNumber: phone, code }) => {
        try {
          const normalized = normalizeGhanaPhone(phone);
          return await arkeselVerifyOTP(normalized, code);
        } catch (err) {
          authLogger.warn({ err }, "Phone OTP verify failed");
          // Surface expiry distinctly — returning false always becomes "Invalid OTP"
          if (err instanceof AppError && err.code === ErrorCode.OTP_EXPIRED) {
            throw APIError.from("BAD_REQUEST", {
              code: "OTP_EXPIRED",
              message: "This code has expired. Request a new one.",
            });
          }
          if (err instanceof AppError && err.code === ErrorCode.OTP_INVALID) {
            throw APIError.from("BAD_REQUEST", {
              code: "INVALID_OTP",
              message: "Invalid OTP code. Check the digits and try again.",
            });
          }
          // Other failures (network, gateway) — still not "success"
          return false;
        }
      },
      /**
       * Password reset OTP: Better Auth generates the code (expiry + attempt limits).
       * We deliver that exact code via SMS so BA can verify it server-side.
       */
      sendPasswordResetOTP: async ({ phoneNumber: phone, code }) => {
        const normalized = normalizeGhanaPhone(phone);
        await assertOtpSendAllowed("phone", normalized);
        await sendSMS(
          [normalized],
          `Your WeWash password reset code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it.`
        );
        await recordOtpSend("phone", normalized);
        authLogger.info({ phone: normalized }, "Phone password-reset OTP sent");
      },
    }),

    emailOTP({
      otpLength: AUTH_OTP.LENGTH,
      expiresIn: AUTH_OTP.EXPIRES_IN_SECONDS,
      allowedAttempts: AUTH_OTP.ALLOWED_ATTEMPTS,
      // Admins create accounts — do not auto-register unknown emails via OTP
      disableSignUp: true,
      storeOTP: "hashed",
      resendStrategy: "rotate",
      rateLimit: AUTH_OTP.EMAIL_RATE_LIMIT,
      async sendVerificationOTP({ email, otp, type }) {
        await assertOtpSendAllowed("email", email);
        // Fire-and-forget pattern avoided on serverless so the mail is actually sent
        await sendOtpEmail({ email, otp, type });
        await recordOtpSend("email", email);
        authLogger.info({ email, type }, "Email OTP sent");
      },
    }),

    // Must be last — sets Set-Cookie correctly in Next.js App Router
    nextCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: (user as { role?: string }).role ?? "STUDENT",
              isActive: (user as { isActive?: boolean }).isActive ?? true,
            },
          };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
