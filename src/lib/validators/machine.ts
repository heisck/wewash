import { z } from "zod";
import { idSchema } from "./shared";

// ─── Create Machine ──────────────────────────────────────────

export const createMachineSchema = z.object({
  serialNumber: z
    .string()
    .min(1, "Machine ID / serial number is required")
    .max(100),
  name: z.string().max(100).optional(),
  code: z.string().max(50).optional(), // e.g. WeWash W1
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  capacityKg: z.coerce.number().positive().max(100).optional(),
  machineType: z.string().max(100).optional(),
  purchaseDate: z.coerce.date().optional(),
  installationDate: z.coerce.date().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  hallId: idSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateMachineInput = z.infer<typeof createMachineSchema>;

// ─── Update Machine ──────────────────────────────────────────

export const updateMachineSchema = createMachineSchema.partial().extend({
  status: z
    .enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY", "DECOMMISSIONED"])
    .optional(),
});

export type UpdateMachineInput = z.infer<typeof updateMachineSchema>;

// ─── Machine Schedule ────────────────────────────────────────

export const createMachineScheduleSchema = z.object({
  machineId: idSchema,
  roomId: idSchema,
  dayOfWeek: z.enum([
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
    "FRIDAY", "SATURDAY", "SUNDAY",
  ]),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM 24h format"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM 24h format"),
  orderIndex: z.number().int().min(0).max(20),
});

export type CreateMachineScheduleInput = z.infer<typeof createMachineScheduleSchema>;

// ─── Bulk Schedule (any number of rooms; admin can start with 1+) ──

export const bulkMachineScheduleSchema = z.object({
  machineId: idSchema,
  schedules: z
    .array(
      z.object({
        roomId: idSchema,
        dayOfWeek: z.enum([
          "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
          "FRIDAY", "SATURDAY", "SUNDAY",
        ]),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        orderIndex: z.number().int().min(0).max(20),
      })
    )
    .min(1, "At least one schedule slot is required")
    .max(14, "Maximum 14 schedule entries per machine"),
});

export type BulkMachineScheduleInput = z.infer<typeof bulkMachineScheduleSchema>;

// ─── Machine Filters ─────────────────────────────────────────

export const machineFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "FAULTY", "DECOMMISSIONED"])
    .optional(),
  hallId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
});

export type MachineFilterInput = z.infer<typeof machineFilterSchema>;
