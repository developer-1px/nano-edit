import { z } from 'zod'
import { createTextBlockBaseSchema } from '../text-block-schema'

const TodoIndentSchema = z.number().int().min(0).max(6).default(0)

export function createTodoBlockSchema<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  return createTextBlockBaseSchema(markSchema).extend({
    type: z.literal('todo'),
    checked: z.boolean(),
    continuationIndents: z.array(z.string().regex(/^[\t ]+$/)).optional(),
    indent: TodoIndentSchema,
    indentText: z.string().regex(/^[\t ]+$/).optional(),
    marker: z.enum(['-', '*', '+']).optional(),
    checkedMarker: z.enum(['x', 'X']).optional(),
  })
}
