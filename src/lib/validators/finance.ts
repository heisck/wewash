import { z } from "zod";
import { idSchema, currencyAmountSchema, dateSchema } from "./shared";

// ─── Contracts ───────────────────────────────────────────────

export const createContractSchema = z.object({
  studentId: idSchema,
  machineId: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  monthlyAmount: currencyAmountSchema, // weekly fee may also be stored here for contracts
  currency: z.string().default("GHS"),
  terms: z.string().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED", "RENEWED"]).optional(),
  terminationNote: z.string().optional(),
});

export type UpdateContractInput = z.infer<typeof updateContractSchema>;

// ─── Payments ────────────────────────────────────────────────

const moneySchema = z.coerce.number().min(0).max(1_000_000);

const paymentFields = {
  // Optional for students — server forces their own studentId.
  studentId: idSchema.optional(),
  contractId: idSchema.optional(),
  amount: moneySchema.optional(), // amount paid (legacy)
  amountDue: moneySchema.optional(),
  amountPaid: moneySchema.optional(),
  currency: z.string().default("GHS"),
  method: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]).default("OTHER"),
  reference: z.string().optional(),
  momoTransactionId: z.string().max(100).optional(),
  description: z.string().optional(),
  dueDate: dateSchema.optional(),
  paidAt: dateSchema.optional(),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z
    .enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"])
    .optional(),
} as const;

/** Base object (no refinements) so `.partial()` works for updates. */
const paymentObjectSchema = z.object(paymentFields);

/**
 * Create requires at least one amount field. Keep this refine only on the
 * create schema — Zod forbids `.partial()` on refined schemas.
 */
export const createPaymentSchema = paymentObjectSchema.superRefine((val, ctx) => {
  if (val.amountPaid == null && val.amount == null && val.amountDue == null) {
    ctx.addIssue({
      code: "custom",
      message: "Amount is required",
      path: ["amountPaid"],
    });
  }
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = paymentObjectSchema.partial().extend({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]).optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// ─── Payment/Contract Filters ────────────────────────────────

export const paymentFilterSchema = z.object({
  studentId: idSchema.optional(),
  contractId: idSchema.optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]).optional(),
  method: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]).optional(),
  fromDate: dateSchema.optional(),
  toDate: dateSchema.optional(),
});
