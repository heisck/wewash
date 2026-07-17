import { RETRY_POLICY } from "@/lib/config/constants";
import { logger } from "@/lib/logger";

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
  /** Return false to stop retrying (e.g. HTTP 422 validation errors). */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Execute an async function with exponential backoff retry.
 * Used for external API calls (Arkesel, Cloudinary, etc.).
 *
 * @example
 * const result = await withRetry(
 *   () => arkeselClient.sendSMS(payload),
 *   { maxRetries: 3 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxRetries = RETRY_POLICY.MAX_RETRIES,
    initialDelayMs = RETRY_POLICY.INITIAL_DELAY_MS,
    backoffMultiplier = RETRY_POLICY.BACKOFF_MULTIPLIER,
    maxDelayMs = RETRY_POLICY.MAX_DELAY_MS,
    timeoutMs = RETRY_POLICY.REQUEST_TIMEOUT_MS,
    onRetry,
    shouldRetry,
  } = options ?? {};

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wrap in timeout
      const result = await withTimeout(fn(), timeoutMs);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const canRetry =
        attempt < maxRetries &&
        (shouldRetry ? shouldRetry(lastError) : true);

      if (canRetry) {
        const delay = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs
        );

        logger.warn(
          { attempt: attempt + 1, maxRetries, delay, error: lastError.message },
          "Retrying after error"
        );

        onRetry?.(lastError, attempt + 1);
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Wrap a promise with a timeout.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Sleep for the given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Throttle a function call.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}
