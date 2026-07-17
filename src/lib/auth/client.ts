"use client";

import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";

/**
 * Better Auth browser client → same-origin `/api/auth/*`.
 *
 * Do NOT set baseURL to a fixed NEXT_PUBLIC_APP_URL here: in local dev that
 * often points at production and signOut/signIn throw "Failed to fetch".
 * Same-origin (omit baseURL / use window origin) keeps cookies and CORS correct.
 */
function clientBaseURL(): string | undefined {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // SSR: prefer public app URL only if set; else leave unset for relative paths
  return process.env.NEXT_PUBLIC_APP_URL || undefined;
}

export const authClient = createAuthClient({
  baseURL: clientBaseURL(),
  plugins: [
    phoneNumberClient(),
    emailOTPClient(),
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

/**
 * Sign out without throwing (network blips / aborted navigations).
 * Always best-effort so UI can redirect even if the fetch fails.
 */
export async function safeSignOut(): Promise<void> {
  try {
    await authClient.signOut({
      fetchOptions: {
        // Don't throw on non-2xx / network — we still clear local session state
        throw: false,
      },
    });
  } catch {
    // Failed to fetch, aborted navigation, etc.
  }
}

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
