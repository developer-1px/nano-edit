import { z } from 'zod'
import { NanoBlockIdSchema } from '../nano-block-id-schema'

export function createTextBlockBaseSchema<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  return z.object({
    id: NanoBlockIdSchema,
    text: z.string(),
    marks: z.array(markSchema).default([]),
  })
}
