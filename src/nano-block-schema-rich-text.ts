import { z } from 'zod'
import { createTodoBlockSchema } from './capabilities/todo/schema'
import { createTextBlockBaseSchema } from './capabilities/text-block-schema'
import {
  addArrayLengthIssue,
  continuationLineCount,
  textLineCount,
} from './nano-block-schema-refinements'
import { NanoMarkSchema } from './nano-mark-schema'

const TextBlockBaseSchema = createTextBlockBaseSchema(NanoMarkSchema)
const ListIndentSchema = z.number().int().min(0).max(6).default(0)
const QuoteMarkerSpacingSchema = z.array(z.enum(['space', 'none'])).min(1)
const QuoteMarkerDepthsSchema = z.array(z.number().int().min(1)).min(1)
const ContinuationIndentsSchema = z.array(z.string().regex(/^[\t ]+$/)).min(1)

const QuoteBlockSchema = TextBlockBaseSchema.extend({
  type: z.literal('quote'),
  quoteMarkerSpacing: QuoteMarkerSpacingSchema.optional(),
  quoteMarkerDepths: QuoteMarkerDepthsSchema.optional(),
}).superRefine((block, ctx) => {
  const lines = textLineCount(block.text)
  addArrayLengthIssue(ctx, 'quoteMarkerSpacing', block.quoteMarkerSpacing?.length, lines)
  addArrayLengthIssue(ctx, 'quoteMarkerDepths', block.quoteMarkerDepths?.length, lines)
})

const CalloutBlockSchema = TextBlockBaseSchema.extend({
  type: z.literal('callout'),
  tone: z.enum(['note', 'tip', 'important', 'warning', 'caution']),
  calloutMarkerDepths: QuoteMarkerDepthsSchema.optional(),
  calloutMarkerSpacing: QuoteMarkerSpacingSchema.optional(),
  calloutTextSpacing: z.enum(['space', 'none']).optional(),
}).superRefine((block, ctx) => {
  const lines = textLineCount(block.text)
  addArrayLengthIssue(ctx, 'calloutMarkerDepths', block.calloutMarkerDepths?.length, lines)
  addArrayLengthIssue(ctx, 'calloutMarkerSpacing', block.calloutMarkerSpacing?.length, lines)
})

const ListItemBlockSchema = TextBlockBaseSchema.extend({
  type: z.literal('list_item'),
  kind: z.enum(['bullet', 'ordered']),
  continuationIndents: ContinuationIndentsSchema.optional(),
  indent: ListIndentSchema,
  indentText: z.string().regex(/^[\t ]+$/).optional(),
  start: z.number().int().min(1).optional(),
  orderedStartText: z.string().regex(/^\d+$/).optional(),
  marker: z.enum(['-', '*', '+']).optional(),
  orderedMarker: z.enum(['.', ')']).optional(),
}).superRefine((block, ctx) => {
  addArrayLengthIssue(ctx, 'continuationIndents', block.continuationIndents?.length, continuationLineCount(block.text))
})

const FootnoteBlockSchema = TextBlockBaseSchema.extend({
  type: z.literal('footnote'),
  name: z.string(),
  footnoteContinuationIndents: ContinuationIndentsSchema.optional(),
  footnoteTextSpacing: z.enum(['space', 'none']).optional(),
}).superRefine((block, ctx) => {
  addArrayLengthIssue(ctx, 'footnoteContinuationIndents', block.footnoteContinuationIndents?.length, continuationLineCount(block.text))
})

export const richTextBlockSchemas = [
  QuoteBlockSchema,
  CalloutBlockSchema,
  createTodoBlockSchema(NanoMarkSchema),
  ListItemBlockSchema,
  FootnoteBlockSchema,
]
