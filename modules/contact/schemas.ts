// modules/contact/schemas.ts
import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  subject: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  message: z.string().trim().min(1).max(5000)
});

export type ContactInputParsed = z.infer<typeof ContactSchema>;
