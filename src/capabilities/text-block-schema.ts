import { z } from 'zod'

export function createTextBlockBaseSchema<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  return z.object({
    id: z.string(),
    text: z.string(),
    marks: z.array(markSchema).default([]),
  })
}
