import { z } from "zod";

/**
 * Environment variable schema — validated at startup.
 * If any required variable is missing, the app crashes immediately
 * with a clear error message (fail-fast).
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("WeWash"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Neon: direct (non-pooled) connection used by Prisma migrations. Falls back to DATABASE_URL.
  DIRECT_URL: z.string().optional().default(""),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).default(10),

  // Redis
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  // Arkesel SMS
  ARKESEL_API_KEY: z.string().min(1, "ARKESEL_API_KEY is required"),
  ARKESEL_SENDER_ID: z.string().min(1).max(11).default("WeWash"),
  ARKESEL_BASE_URL: z
    .string()
    .url()
    .default("https://sms.arkesel.com"),
  ARKESEL_SANDBOX: z
    .enum(["true", "false"])
    .default("true")
    .transform((val) => val === "true"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),

  // Web Push (VAPID) — generate with: npx web-push generate-vapid-keys
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().optional().default("mailto:admin@wewash.app"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional().default(""),

  // Cron (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`)
  CRON_SECRET: z.string().optional().default(""),

  // Contact / WhatsApp (fallback defaults; live values come from SystemConfig)
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional().default(""),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().optional().default(""),

  // Sentry
  SENTRY_DSN: z.string().optional().default(""),
  SENTRY_ENVIRONMENT: z.string().optional().default("development"),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(formatted, null, 2));
    throw new Error("Invalid environment variables. See above for details.");
  }

  return parsed.data;
}

/**
 * Validated environment variables.
 * Access via `env.DATABASE_URL`, `env.ARKESEL_API_KEY`, etc.
 * Throws at import time if any required variable is missing.
 */
export const env = validateEnv();
