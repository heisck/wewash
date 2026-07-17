import { z } from "zod";
import { ghanaPhoneSchema, emailSchema, idSchema } from "./shared";

// ─── Create Student ──────────────────────────────────────────

export const createStudentSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .max(50, "Student ID is too long"),
  indexNumber: z.string().max(50).optional(),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100),
  phone: ghanaPhoneSchema,
  secondaryPhone: ghanaPhoneSchema.optional(),
  whatsapp: ghanaPhoneSchema.optional(),
  email: emailSchema, // Required so admin can create login account
  roomId: idSchema.optional(),
  weeklyAmount: z.coerce.number().min(0).max(100_000).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: ghanaPhoneSchema.optional(),
  profileImageUrl: z.string().url().optional(),
  documentUrls: z.array(z.string().url()).optional(),
  /** Temporary password for the student login (admin-assigned). */
  temporaryPassword: z.string().min(8).max(100).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// ─── Update Student ──────────────────────────────────────────

export const updateStudentSchema = createStudentSchema.partial().extend({
  isActive: z.boolean().optional(),
  email: emailSchema.optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ─── Student Filters ─────────────────────────────────────────

export const studentFilterSchema = z.object({
  search: z.string().optional(),
  roomId: idSchema.optional(),
  hallId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
});

export type StudentFilterInput = z.infer<typeof studentFilterSchema>;
