import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth catch-all route (App Router).
 * Docs: https://www.better-auth.com/docs/integrations/next
 * Mounted at /api/auth/* — email, Google, phone OTP, session, etc.
 */
export const { GET, POST } = toNextJsHandler(auth);
