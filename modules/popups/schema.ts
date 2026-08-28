// modules/popups/schema.ts
// Zod validation for popup create/update inputs.
// Forms send strings; we normalise here.

import { z } from 'zod';

const MAX_HTML_BYTES = 500 * 1024;
const pathLine = z
  .string()
  .min(1)
  .regex(/^\//, 'Path must start with /')
  .refine((s) => !s.includes('://'), 'Absolute URLs not allowed');

const baseShape = {
  name: z.string().min(1).max(120),
  htmlContent: z
    .string()
    .min(1)
    .refine((s) => Buffer.byteLength(s, 'utf8') <= MAX_HTML_BYTES, 'htmlContent too large (max 500 KB)'),
  triggerType: z.enum(['ALL', 'HOMEPAGE', 'PATH']),
  triggerPaths: z.array(pathLine).nullable(),
  frequency: z.enum(['ALWAYS', 'ONCE']),
  delaySeconds: z.number().int().min(0).max(300),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  notes: z.string().max(500).nullable()
};

export const PopupCreateSchema = z
  .object(baseShape)
  .superRefine((val, ctx) => {
    if (val.triggerType === 'PATH') {
      if (!val.triggerPaths || val.triggerPaths.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['triggerPaths'],
          message: 'triggerPaths is required when triggerType is PATH'
        });
      }
    }
  });

export const PopupUpdateSchema = z
  .object({
    id: z.string().min(1),
    ...baseShape
  })
  .partial({ name: true, htmlContent: true, triggerType: true, triggerPaths: true, frequency: true, delaySeconds: true, status: true, notes: true })
  .superRefine((val, ctx) => {
    if (val.triggerType === 'PATH' && val.triggerPaths !== undefined) {
      if (!val.triggerPaths || val.triggerPaths.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['triggerPaths'],
          message: 'triggerPaths is required when triggerType is PATH'
        });
      }
    }
  });
