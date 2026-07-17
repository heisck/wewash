"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins";

/**
 * Better Auth browser client.
 * Talks to /api/auth/[...all] (see better-auth Next.js docs).
 *
 * baseURL must match BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL in production.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  plugins: [
    phoneNumberClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        phone: { type: "string", required: false },
        isActive: { type: "boolean" },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "STUDENT";
  phone?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
};
