import { z } from "zod";
import { PAGINATION } from "@/lib/config/constants";

/**
 * Parse and validate pagination params from URL search params.
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Parse pagination from NextRequest searchParams.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationInput {
  return paginationSchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
}

/**
 * Calculate Prisma skip/take from page/limit.
 */
export function toSkipTake(pagination: PaginationInput): {
  skip: number;
  take: number;
} {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  };
}

/**
 * Parse sort params from URL search params.
 * Validates sortBy against allowed fields to prevent injection.
 */
export function parseSort(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField = "createdAt",
  defaultOrder: "asc" | "desc" = "desc"
): { sortBy: string; sortOrder: "asc" | "desc" } {
  const sortBy = searchParams.get("sortBy") ?? defaultField;
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : defaultOrder;

  // Validate sortBy against allowed fields
  const safeSortBy = allowedFields.includes(sortBy) ? sortBy : defaultField;

  return { sortBy: safeSortBy, sortOrder };
}
