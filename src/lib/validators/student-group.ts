import { z } from "zod";
import { idSchema } from "./shared";

export const createStudentGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(120)
    .transform((s) => s.trim()),
  hallId: idSchema,
  floor: z
    .string()
    .min(1, "Floor is required")
    .max(40)
    .transform((s) => s.trim()),
  block: z
    .string()
    .min(1, "Block is required")
    .max(40)
    .transform((s) => s.trim()),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateStudentGroupInput = z.infer<typeof createStudentGroupSchema>;

export const updateStudentGroupSchema = createStudentGroupSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type UpdateStudentGroupInput = z.infer<typeof updateStudentGroupSchema>;

export const studentGroupFilterSchema = z.object({
  hallId: idSchema.optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type StudentGroupFilterInput = z.infer<typeof studentGroupFilterSchema>;
