"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

/**
 * Better Auth browser client. Talks to the handler mounted at
 * /api/auth/[...all]. Exposes email/password + Google social sign-in.
 *
 * We declare the extra user fields (role/phone/isActive) at runtime here so we
 * don't have to import the server `auth` instance (which would pull Prisma into
 * the client bundle).
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  plugins: [
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
  isActive: boolean;
};
