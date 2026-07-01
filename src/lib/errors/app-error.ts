import { ErrorCodeType, ErrorHttpStatus, ErrorCode } from "./error-codes";

/**
 * Custom application error with structured error codes and HTTP status.
 * Throw this from any layer — the global error handler will serialize it.
 */
export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCodeType,
    message: string,
    options?: {
      statusCode?: number;
      details?: unknown;
      isOperational?: boolean;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? ErrorHttpStatus[code] ?? 500;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize to API response format.
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }

  // ─── Factory methods for common errors ──────────────────

  static notFound(entity: string, id?: string): AppError {
    const message = id
      ? `${entity} with ID '${id}' not found`
      : `${entity} not found`;
    return new AppError(ErrorCode.NOT_FOUND, message);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, { details });
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message = "Insufficient permissions"): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message);
  }

  static conflict(message: string): AppError {
    return new AppError(ErrorCode.CONFLICT, message);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, { details });
  }

  static rateLimited(retryAfterSeconds?: number): AppError {
    return new AppError(
      ErrorCode.TOO_MANY_REQUESTS,
      `Rate limit exceeded. ${retryAfterSeconds ? `Retry after ${retryAfterSeconds} seconds.` : "Please try again later."}`,
      { details: retryAfterSeconds ? { retryAfter: retryAfterSeconds } : undefined }
    );
  }

  static internal(message = "An unexpected error occurred", cause?: Error): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, {
      isOperational: false,
      cause,
    });
  }
}
