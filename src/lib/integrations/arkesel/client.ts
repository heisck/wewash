import { env } from "@/lib/config/env";
import { ARKESEL, RETRY_POLICY } from "@/lib/config/constants";
import { withRetry } from "@/lib/utils/retry";
import { logger } from "@/lib/logger";
import type {
  ArkeselClientConfig,
  ArkeselErrorResponse,
} from "./types";

const arkeselLogger = logger.child({ service: "arkesel" });

/**
 * Arkesel HTTP client.
 * Handles authentication, retries, timeouts, and error mapping.
 *
 * All Arkesel V2 requests use header-based auth:
 *   headers: { 'api-key': 'YOUR_API_KEY' }
 */
class ArkeselClient {
  private config: ArkeselClientConfig;

  constructor(config: ArkeselClientConfig) {
    this.config = config;
  }

  /**
   * Make an authenticated request to the Arkesel API.
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST";
      body?: unknown;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { method = "POST", body, retries = this.config.maxRetries } = options;
    const url = `${this.config.baseUrl}${endpoint}`;

    arkeselLogger.debug(
      { endpoint, method, sandbox: this.config.sandbox },
      "Arkesel API request"
    );

    return withRetry(
      async () => {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          this.config.timeoutMs
        );

        try {
          const response = await fetch(url, {
            method,
            headers: {
              "api-key": this.config.apiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            signal: controller.signal,
          });

          const raw = await response.text();
          const contentType = response.headers.get("content-type") || "";

          // Wrong path (e.g. /api/v2/otp/send) returns Laravel HTML 404 — not JSON
          if (!contentType.includes("application/json") && raw.trimStart().startsWith("<")) {
            throw new ArkeselApiError(
              `Arkesel returned HTML instead of JSON for ${endpoint} (HTTP ${response.status}). Check endpoint URL.`,
              response.status,
              endpoint
            );
          }

          let data: unknown;
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            throw new ArkeselApiError(
              `Invalid JSON from Arkesel ${endpoint}: ${raw.slice(0, 120)}`,
              response.status,
              endpoint
            );
          }

          if (!response.ok) {
            const errorData = data as ArkeselErrorResponse;
            arkeselLogger.error(
              {
                status: response.status,
                endpoint,
                error: errorData.message,
              },
              "Arkesel API error"
            );
            throw new ArkeselApiError(
              errorData.message || `HTTP ${response.status}`,
              response.status,
              endpoint
            );
          }

          arkeselLogger.info(
            { endpoint, status: response.status },
            "Arkesel API success"
          );

          return data as T;
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        maxRetries: retries,
        initialDelayMs: RETRY_POLICY.INITIAL_DELAY_MS,
        backoffMultiplier: RETRY_POLICY.BACKOFF_MULTIPLIER,
        maxDelayMs: RETRY_POLICY.MAX_DELAY_MS,
        timeoutMs: this.config.timeoutMs,
        onRetry: (error, attempt) => {
          arkeselLogger.warn(
            { endpoint, attempt, error: error.message },
            "Arkesel API retry"
          );
        },
      }
    );
  }

  /**
   * Check if sandbox mode is enabled.
   */
  get isSandbox(): boolean {
    return this.config.sandbox;
  }

  /**
   * Get the configured sender ID.
   */
  get senderId(): string {
    return this.config.senderId;
  }
}

/**
 * Custom error for Arkesel API failures.
 */
export class ArkeselApiError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;

  constructor(message: string, statusCode: number, endpoint: string) {
    super(message);
    this.name = "ArkeselApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Singleton Arkesel client instance.
 */
let clientInstance: ArkeselClient | null = null;

export function getArkeselClient(): ArkeselClient {
  if (!clientInstance) {
    clientInstance = new ArkeselClient({
      apiKey: env.ARKESEL_API_KEY,
      baseUrl: env.ARKESEL_BASE_URL,
      senderId: env.ARKESEL_SENDER_ID,
      sandbox: env.ARKESEL_SANDBOX,
      timeoutMs: RETRY_POLICY.REQUEST_TIMEOUT_MS,
      maxRetries: RETRY_POLICY.MAX_RETRIES,
    });
  }
  return clientInstance;
}

export default ArkeselClient;
