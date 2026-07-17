import { Redis, type RedisOptions } from "ioredis";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Upstash is TLS-only. Plain `redis://…upstash.io` connects then ECONNRESETs.
 * Docs: https://upstash.com/docs/redis/troubleshooting/econn_reset
 * → URL must start with `rediss://` (double s).
 */
export function normalizeRedisUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const isUpstash = parsed.hostname.includes("upstash.io");
    if (isUpstash && parsed.protocol === "redis:") {
      parsed.protocol = "rediss:";
      // Upstash TLS endpoint is typically 6379 over TLS
      if (!parsed.port) parsed.port = "6379";
      logger.warn(
        { host: parsed.hostname },
        "REDIS_URL used redis:// for Upstash — upgraded to rediss:// (TLS required)"
      );
      return parsed.toString();
    }
  } catch {
    // leave as-is; ioredis will error clearly
  }
  return trimmed;
}

function createRedisClient(): Redis {
  const url = normalizeRedisUrl(env.REDIS_URL);
  const isTls = url.startsWith("rediss://");

  const options: RedisOptions = {
    // Fail fast on flaky network; otp-guard / rate-limit fail-open
    maxRetriesPerRequest: 2,
    connectTimeout: 10_000,
    // Upstash: ready check + family can cause extra chatter on serverless/dev
    enableReadyCheck: false,
    lazyConnect: false,
    // Avoid reconnect storms that burn free-tier concurrent connections
    retryStrategy(times) {
      if (times > 8) {
        logger.error({ times }, "Redis gave up reconnecting");
        return null; // stop
      }
      return Math.min(times * 300, 5_000);
    },
    // Keep one long-lived connection; don't spam connect logs via new clients
    keepAlive: 10_000,
    ...(isTls
      ? {
          tls: {
            // Required for rediss:// to Upstash
            rejectUnauthorized: true,
          },
        }
      : {}),
  };

  const client = new Redis(url, options);

  let lastLog = 0;
  const throttle = (fn: () => void) => {
    const now = Date.now();
    if (now - lastLog < 5_000) return;
    lastLog = now;
    fn();
  };

  client.on("connect", () => {
    throttle(() => logger.info("Redis connected"));
  });

  client.on("ready", () => {
    throttle(() => logger.info("Redis ready"));
  });

  client.on("error", (err) => {
    throttle(() => logger.error({ err }, "Redis error"));
  });

  client.on("close", () => {
    throttle(() => logger.warn("Redis connection closed"));
  });

  return client;
}

/**
 * Redis client singleton (ioredis).
 * Used for OTP cooldowns, rate limiting, cache, BullMQ.
 *
 * Upstash free tier (typical): 256 MB, 500K commands/month, 10 GB bandwidth.
 * Flapping connect/close is almost never "too many commands" — it's bad URL/TLS
 * or too many concurrent TCP clients. Prefer one singleton + rediss://.
 */
export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ─── Cache Helper Functions ───────────────────────────────────

export async function cacheGet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Cache miss or error — fall through to factory
  }

  const value = await factory();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache write failure is non-critical
  }

  return value;
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    if (pattern.includes("*")) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch (err) {
    logger.error({ err, pattern }, "Cache invalidation error");
  }
}

export default redis;
