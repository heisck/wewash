import { Redis } from "ioredis";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
    connectTimeout: 10_000,
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  client.on("error", (err) => {
    logger.error({ err }, "Redis error");
  });

  client.on("close", () => {
    logger.warn("Redis connection closed");
  });

  return client;
}

/**
 * Redis client singleton.
 * Used for caching, rate limiting, session storage, and BullMQ queues.
 */
export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ─── Cache Helper Functions ───────────────────────────────────

/**
 * Get a cached value, or execute the factory function and cache the result.
 */
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

/**
 * Invalidate a cache key or pattern.
 */
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
