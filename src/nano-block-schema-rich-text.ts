import { z } from 'zod'
import { createTodoBlockSchema } from './capabilities/todo/schema'
import { createTextBlockBaseSchema } from './capabilities/text-block-schema'
import { NanoMarkSchema } from './nano-mark-schema'

const TextBlockBaseSchema = createTextBlockBaseSchema(NanoMarkSchema)
const ListIndentSchema = z.number().int().min(0).max(6).default(0)

export const richTextBlockSchemas = [
  TextBlockBaseSchema.extend({
    type: z.literal('quote'),
    quoteMarkerSpacing: z.array(z.enum(['space', 'none'])).optional(),
    quoteMarkerDepths: z.array(z.number().int().min(1)).optional(),
  }),
  TextBlockBaseSchema.extend({
    type: z.literal('callout'),
    tone: z.enum(['note', 'tip', 'important', 'warning', 'caution']),
    calloutMarkerDepths: z.array(z.number().int().min(1)).optional(),
    calloutMarkerSpacing: z.array(z.enum(['space', 'none'])).optional(),
    calloutTextSpacing: z.enum(['space', 'none']).optional(),
  }),
  createTodoBlockSchema(NanoMarkSchema),
  TextBlockBaseSchema.extend({
    type: z.literal('list_item'),
    kind: z.enum(['bullet', 'ordered']),
    continuationIndents: z.array(z.string().regex(/^[\t ]+$/)).optional(),
    indent: ListIndentSchema,
    indentText: z.string().regex(/^[\t ]+$/).optional(),
    start: z.number().int().min(1).optional(),
    orderedStartText: z.string().regex(/^\d+$/).optional(),
    marker: z.enum(['-', '*', '+']).optional(),
    orderedMarker: z.enum(['.', ')']).optional(),
  }),
  TextBlockBaseSchema.extend({
    type: z.literal('footnote'),
    name: z.string(),
    footnoteContinuationIndents: z.array(z.string().regex(/^[\t ]+$/)).optional(),
    footnoteTextSpacing: z.enum(['space', 'none']).optional(),
  }),
]
