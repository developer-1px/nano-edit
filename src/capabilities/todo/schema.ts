import { z } from 'zod'
import {
  addArrayLengthIssue,
  continuationLineCount,
} from '../../nano-block-schema-refinements'
import { createTextBlockBaseSchema } from '../text-block-schema'

const TodoIndentSchema = z.number().int().min(0).max(6).default(0)
const ContinuationIndentsSchema = z.array(z.string().regex(/^[\t ]+$/)).min(1)

export function createTodoBlockSchema<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  return createTextBlockBaseSchema(markSchema).extend({
    type: z.literal('todo'),
    checked: z.boolean(),
    continuationIndents: ContinuationIndentsSchema.optional(),
    indent: TodoIndentSchema,
    indentText: z.string().regex(/^[\t ]+$/).optional(),
    marker: z.enum(['-', '*', '+']).optional(),
    checkedMarker: z.enum(['x', 'X']).optional(),
  }).superRefine((block, ctx) => {
    addArrayLengthIssue(ctx, 'continuationIndents', block.continuationIndents?.length, continuationLineCount(block.text))
  })
}
