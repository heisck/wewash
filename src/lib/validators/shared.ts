import { z } from "zod";
import { GHANA_PHONE } from "@/lib/config/constants";

/**
 * Reusable Zod field schemas.
 */
export const ghanaPhoneSchema = z
  .string()
  .regex(GHANA_PHONE.REGEX, "Invalid Ghana phone number (e.g., 0241234567 or +233241234567)");

export const emailSchema = z.string().email("Invalid email address");

export const idSchema = z.string().cuid("Invalid ID format");

export const dateSchema = z.coerce.date();

export const currencyAmountSchema = z
  .number()
  .positive("Amount must be positive")
  .multipleOf(0.01, "Amount must have at most 2 decimal places");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
});
