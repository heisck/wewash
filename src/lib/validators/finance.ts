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

export const createPaymentSchema = z.object({
  studentId: idSchema,
  contractId: idSchema.optional(),
  amount: moneySchema.optional(), // amount paid (legacy)
  amountDue: moneySchema.optional(),
  amountPaid: moneySchema.optional(),
  currency: z.string().default("GHS"),
  method: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]),
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
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = createPaymentSchema.partial().extend({
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
