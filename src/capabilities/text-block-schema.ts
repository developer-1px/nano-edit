import { z } from 'zod'
import { NanoBlockIdSchema } from '../entities/block/schema/nano-block-id-schema'

export function createTextBlockBaseSchema<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  return z.object({
    id: NanoBlockIdSchema,
    text: z.string(),
    marks: z.array(markSchema).default([]),
    textDirection: z.enum(['ltr', 'rtl', 'auto']).optional(),
  }).strict()
}
