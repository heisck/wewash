import { z } from "zod";
import { idSchema } from "./shared";

export const createHallSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20),
  location: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  capacity: z.coerce.number().int().min(0).default(0),
});

export type CreateHallInput = z.infer<typeof createHallSchema>;

export const updateHallSchema = createHallSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateHallInput = z.infer<typeof updateHallSchema>;

export const createRoomSchema = z.object({
  number: z.string().min(1, "Room number is required").max(50),
  block: z.string().max(50).optional(),
  floor: z.coerce.number().int().optional(),
  section: z.string().max(50).optional(),
  capacity: z.coerce.number().int().min(1).default(1),
  hallId: idSchema,
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
