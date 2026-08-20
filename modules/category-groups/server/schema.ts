import { z } from 'zod';

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(120)
});

export const UpdateGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.number().int().optional()
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
