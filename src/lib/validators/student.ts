import { z } from "zod";
import { ghanaPhoneSchema, emailSchema, idSchema } from "./shared";

// ─── Create Student ──────────────────────────────────────────

export const createStudentSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .max(50, "Student ID is too long"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100),
  phone: ghanaPhoneSchema,
  email: emailSchema.optional(),
  roomId: idSchema.optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: ghanaPhoneSchema.optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// ─── Update Student ──────────────────────────────────────────

export const updateStudentSchema = createStudentSchema.partial();

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ─── Student Filters ─────────────────────────────────────────

export const studentFilterSchema = z.object({
  search: z.string().optional(),
  roomId: idSchema.optional(),
  hallId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
});

export type StudentFilterInput = z.infer<typeof studentFilterSchema>;
