import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { sendOTP, verifyOTP } from "@/lib/integrations/arkesel";
import { AppError } from "@/lib/errors";

/**
 * Better Auth configuration instance.
 * Supports Email/Password, Google OAuth, and Phone/SMS OTP.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    // Public self-registration is off. Admins provision student accounts.
    disableSignUp: true,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    },
  },

  phoneNumber: {
    enabled: true,
    sendOTP: async ({ phoneNumber, code }: { phoneNumber: string, code: string }) => {
      try {
        await sendOTP(phoneNumber, {
          message: `Your WeWash login code is ${code}. It expires in 5 minutes.`,
        });
      } catch (err) {
        throw AppError.internal("Failed to send SMS OTP", err as Error);
      }
    },
    verifyOTP: async ({ phoneNumber, code }: { phoneNumber: string, code: string }) => {
      // Arkesel verification is already integrated in our verifyOTP helper
      try {
        const isValid = await verifyOTP(phoneNumber, code);
        return {
          status: isValid ? "success" : "failed",
        };
      } catch (err) {
        return { status: "failed" };
      }
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
      },
      phone: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
