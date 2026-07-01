import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

/**
 * Application logger using Pino.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ userId, action }, "User performed action");
 *   logger.error({ err }, "Something went wrong");
 */
export const logger = pino({
  name: "wewash",
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,

  ...(isProduction
    ? {
        // Production: structured JSON logs
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }
    : {
        // Development: pretty-printed logs
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),

  // Redact sensitive fields from logs
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "secret",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.apiKey",
    ],
    remove: true,
  },
});

/**
 * Create a child logger with a specific context (e.g., request ID, service name).
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export default logger;
