import { z } from "zod";
import { idSchema, dateSchema, currencyAmountSchema } from "./shared";

// ─── Fault Reports ───────────────────────────────────────────

export const createFaultReportSchema = z.object({
  machineId: idSchema,
  reportedById: idSchema,
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Please provide more details").max(2000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  imageUrls: z.array(z.string().url()).max(5).optional().default([]),
});

export type CreateFaultReportInput = z.infer<typeof createFaultReportSchema>;

export const updateFaultReportSchema = createFaultReportSchema.partial().extend({
  status: z.enum(["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED", "WONT_FIX"]).optional(),
  resolution: z.string().max(2000).optional(),
  estimatedCost: currencyAmountSchema.optional(),
  actualCost: currencyAmountSchema.optional(),
});

export type UpdateFaultReportInput = z.infer<typeof updateFaultReportSchema>;

// ─── Maintenance Logs ────────────────────────────────────────

export const createMaintenanceLogSchema = z.object({
  machineId: idSchema,
  type: z.string().min(1).max(50),
  description: z.string().min(1).max(2000),
  cost: currencyAmountSchema.optional(),
  scheduledDate: dateSchema.optional(),
  completedDate: dateSchema.optional(),
  nextDueDate: dateSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateMaintenanceLogInput = z.infer<typeof createMaintenanceLogSchema>;

// ─── Transfer Logs ───────────────────────────────────────────

export const createTransferLogSchema = z.object({
  machineId: idSchema,
  fromHallId: idSchema.optional(),
  fromRoomInfo: z.string().max(200).optional(),
  toHallId: idSchema.optional(),
  toRoomInfo: z.string().max(200).optional(),
  reason: z.enum(["RELOCATION", "MAINTENANCE", "DECOMMISSION", "REPLACEMENT", "REBALANCING", "OTHER"]),
  notes: z.string().max(1000).optional(),
});

export type CreateTransferLogInput = z.infer<typeof createTransferLogSchema>;
