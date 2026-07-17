import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { sendOTP as arkeselSendOTP, verifyOTP as arkeselVerifyOTP } from "@/lib/integrations/arkesel";
import { normalizeGhanaPhone } from "@/lib/utils/phone";
import { logger } from "@/lib/logger";

const authLogger = logger.child({ service: "better-auth" });

/**
 * Better Auth server config (docs: https://www.better-auth.com/docs)
 *
 * - Email/password: sign-in enabled; public sign-up disabled (admins create students)
 * - Google OAuth: enabled only when GOOGLE_CLIENT_ID/SECRET are set
 * - Phone OTP: phoneNumber plugin + Arkesel SMS
 * - nextCookies: required for Next.js App Router cookie/session handling
 * - Prisma adapter: users/sessions live in YOUR Postgres (Neon/etc.), not a separate Auth DB
 */
export const auth = betterAuth({
  appName: env.APP_NAME,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // You already set this in .env / Vercel
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  // Allow the public app URL (and local dev) to call the auth API
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
    // First SUPER_ADMIN: use `npm run auth:create-admin` (see scripts).
    disableSignUp: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  // Only register Google when both credentials exist (avoids boot errors)
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
        input: false, // clients cannot set role on sign-up
      },
      // Domain convenience field (mirrors phoneNumber for older code paths)
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

  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 5,
      // Ghana numbers: 0XXXXXXXXX or +233XXXXXXXXX
      phoneNumberValidator: async (raw) => {
        try {
          normalizeGhanaPhone(raw);
          return true;
        } catch {
          return false;
        }
      },
      /**
       * Arkesel generates & delivers its own OTP (%otp_code%).
       * We do not embed Better Auth's internal `code` in the SMS body.
       */
      sendOTP: async ({ phoneNumber: phone }) => {
        const normalized = normalizeGhanaPhone(phone);
        await arkeselSendOTP(normalized, {
          message:
            "Your WeWash login code is %otp_code%. It expires in 5 minutes. Do not share it.",
        });
        authLogger.info({ phone: normalized }, "Phone OTP sent via Arkesel");
      },
      /**
       * Verify against Arkesel (not Better Auth's internal OTP store).
       */
      verifyOTP: async ({ phoneNumber: phone, code }) => {
        try {
          const normalized = normalizeGhanaPhone(phone);
          return await arkeselVerifyOTP(normalized, code);
        } catch (err) {
          authLogger.warn({ err }, "Phone OTP verify failed");
          return false;
        }
      },
      // Do NOT auto-sign-up unknown phones (admin creates accounts)
      // signUpOnVerification: undefined
    }),

    // Must be last — sets Set-Cookie correctly in Next.js App Router
    nextCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Keep role/isActive defaults for any server-created users
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
