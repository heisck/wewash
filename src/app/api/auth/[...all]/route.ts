import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

// Export standard handlers for Next.js App Router
export const { GET, POST } = toNextJsHandler(auth);
