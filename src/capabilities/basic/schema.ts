import { z } from 'zod'
import { createTextBlockBaseSchema } from '../text-block-schema'

export function createBasicBlockSchemas<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  const textBlockBaseSchema = createTextBlockBaseSchema(markSchema)

  return [
    textBlockBaseSchema.extend({ type: z.literal('paragraph') }),
    textBlockBaseSchema.extend({
      type: z.literal('heading'),
      level: z.number().int().min(1).max(6),
      headingStyle: z.enum(['atx', 'setext']).optional(),
      atxClosingLength: z.number().int().min(1).optional(),
      atxClosingSpacing: z.number().int().min(1).optional(),
      atxTextSpacing: z.number().int().min(1).optional(),
      setextMarker: z.enum(['=', '-']).optional(),
      setextLength: z.number().int().min(1).optional(),
    }),
  ] as const
}
