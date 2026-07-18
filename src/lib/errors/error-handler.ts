import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./app-error";
import { ErrorCode } from "./error-codes";
import { logger } from "@/lib/logger";
import type { ApiErrorResponse } from "@/lib/types/api";

/**
 * Global error handler for API routes.
 * Normalizes all error types into a consistent API response.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // ─── AppError (our custom errors) ──────────────────────
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error({ err: error, code: error.code }, "Non-operational error");
    } else if (error.statusCode >= 500) {
      logger.error({ code: error.code, message: error.message }, "Operational server error");
    } else {
      // Avoid logging full IDs for not-found noise at warn spam level
      logger.info(
        { code: error.code, status: error.statusCode },
        error.statusCode === 404 ? "Not found" : "Client error"
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.toJSON(),
      },
      { status: error.statusCode }
    );
  }

  // ─── Zod validation errors ─────────────────────────────
  // Zod 4: issues[]; older shapes used errors[]
  if (error instanceof ZodError) {
    const issues =
      (error as ZodError).issues ??
      (error as unknown as { errors?: ZodError["issues"] }).errors ??
      [];
    const details = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join(".") : String(e.path ?? ""),
      message: e.message,
    }));

    logger.warn({ details }, "Validation failed");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: details[0]?.message || "Validation failed",
          details,
        },
      },
      { status: 422 }
    );
  }

  // ─── Prisma errors ─────────────────────────────────────
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error({ err: error }, "Prisma validation error");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: "Invalid data provided",
        },
      },
      { status: 400 }
    );
  }

  // ─── Generic errors ────────────────────────────────────
  if (error instanceof Error) {
    logger.error({ err: error }, "Unhandled error");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }

  // ─── Unknown errors ────────────────────────────────────
  logger.error({ error }, "Unknown error type");
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}

/**
 * Handle Prisma-specific error codes.
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse<ApiErrorResponse> {
  switch (error.code) {
    case "P2002": {
      // Unique constraint violation
      const target = (error.meta?.target as string[]) ?? [];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DUPLICATE_ENTRY,
            message: `A record with this ${target.join(", ")} already exists`,
            details: { fields: target },
          },
        },
        { status: 409 }
      );
    }

    case "P2025": {
      // Record not found
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: "Record not found",
          },
        },
        { status: 404 }
      );
    }

    case "P2003": {
      // Foreign key constraint violation
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.BAD_REQUEST,
            message: "Referenced record does not exist",
          },
        },
        { status: 400 }
      );
    }

    default:
      logger.error({ err: error, code: error.code }, "Unhandled Prisma error");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: "Database error occurred",
          },
        },
        { status: 500 }
      );
  }
}
