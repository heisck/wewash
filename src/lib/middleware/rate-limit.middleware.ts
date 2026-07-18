import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db/redis";
import { RATE_LIMITS, CACHE_TTL } from "@/lib/config/constants";
import { ErrorCode } from "@/lib/errors/error-codes";
import { logger } from "@/lib/logger";

interface RateLimitConfig {
  max: number;      // Maximum requests per window
  windowMs: number; // Window size in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;   // Unix timestamp (seconds)
  retryAfter: number; // Seconds until next allowed request
}

/**
 * Check rate limit using Redis sliding window.
 * Returns whether the request is allowed and metadata.
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();
    
    // Remove entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count entries in the current window
    pipeline.zcard(key);
    
    // Add current request (unique member per hit)
    const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;
    pipeline.zadd(key, now, member);
    
    // Set TTL on the key
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();
    
    if (!results) {
      // Redis unavailable — allow the request (fail-open)
      return { allowed: true, remaining: config.max, resetAt: 0, retryAfter: 0 };
    }

    // zcard is before zadd → count of prior requests in the window
    const currentCount = (results[1]?.[1] as number) ?? 0;
    const allowed = currentCount < config.max;
    const remaining = Math.max(0, config.max - currentCount - (allowed ? 1 : 0));
    const resetAt = Math.ceil((now + config.windowMs) / 1000);
    const retryAfter = allowed ? 0 : Math.ceil(config.windowMs / 1000);

    if (!allowed) {
      // Drop this denied hit so it doesn't inflate the window further
      await redis.zrem(key, member).catch(() => {});
    }

    return { allowed, remaining, resetAt, retryAfter };
  } catch (err) {
    logger.error({ err, key }, "Rate limit check failed");
    // Fail-open: allow the request if Redis is down
    return { allowed: true, remaining: config.max, resetAt: 0, retryAfter: 0 };
  }
}

/**
 * Get client identifier for rate limiting.
 * Uses IP address (from X-Forwarded-For or connection) + optional user ID.
 */
function getClientKey(request: NextRequest, userId?: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Rate limit middleware for API routes.
 *
 * @example
 * // In your API route:
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, "AUTH");
 *   if (rateLimitResult) return rateLimitResult; // 429 response
 *   // ... handle request
 * }
 */
export async function rateLimit(
  request: NextRequest,
  category: keyof typeof RATE_LIMITS,
  userId?: string
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[category];
  const clientKey = getClientKey(request, userId);
  const key = `rl:${category}:${clientKey}`;

  const result = await checkRateLimit(key, config);

  if (!result.allowed) {
    logger.warn(
      { category, clientKey, remaining: result.remaining },
      "Rate limit exceeded"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          details: { retryAfter: result.retryAfter },
        },
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(config.max),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.resetAt),
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }

  return null; // Allowed — continue processing
}

/**
 * Higher-order function to wrap an API handler with rate limiting.
 */
export function withRateLimit<T extends unknown[]>(
  category: keyof typeof RATE_LIMITS,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    const rateLimitResult = await rateLimit(request, category);
    if (rateLimitResult) return rateLimitResult;
    return handler(request, ...args);
  };
}
