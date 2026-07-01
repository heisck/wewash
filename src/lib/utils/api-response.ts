import { NextResponse } from "next/server";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
} from "@/lib/types/api";

/**
 * Standard success response.
 */
export function successResponse<T>(
  data: T,
  status = 200,
  meta?: PaginationMeta
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

/**
 * Created response (201).
 */
export function createdResponse<T>(
  data: T
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 201);
}

/**
 * No content response (204).
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Error response — prefer throwing AppError and letting the global
 * handler format the response. Use this only for custom error shapes.
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Build pagination meta from total count and query params.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
