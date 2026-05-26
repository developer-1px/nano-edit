import { z } from 'zod'
import { NonBlankStringSchema } from '../block/schema/nano-block-schema-refinements'

const MarkRangeBaseSchema = z.object({
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative(),
})

export const NanoMarkSchema = z.discriminatedUnion('type', [
  MarkRangeBaseSchema.extend({
    type: z.literal('bold'),
    marker: z.enum(['**', '__']).optional(),
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('italic'),
    marker: z.enum(['*', '_']).optional(),
  }),
  MarkRangeBaseSchema.extend({ type: z.literal('underline') }),
  MarkRangeBaseSchema.extend({ type: z.literal('strike') }),
  MarkRangeBaseSchema.extend({ type: z.literal('highlight') }),
  MarkRangeBaseSchema.extend({
    type: z.literal('code'),
    backtickLength: z.number().int().min(1).optional(),
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('tag'),
    name: NonBlankStringSchema,
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('note_link'),
    target: NonBlankStringSchema,
    alias: z.string().optional(),
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('math'),
    formula: NonBlankStringSchema,
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('footnote_ref'),
    name: NonBlankStringSchema,
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('link'),
    href: NonBlankStringSchema,
    destinationStyle: z.enum(['angle']).optional(),
    title: z.string().optional(),
    syntax: z.enum(['autolink', 'bare']).optional(),
    image: z.boolean().optional(),
    imageEmptyAlt: z.boolean().optional(),
  }),
  MarkRangeBaseSchema.extend({
    type: z.literal('source'),
  }),
]).superRefine((mark, ctx) => {
  if (mark.from < mark.to) return

  ctx.addIssue({
    code: 'custom',
    message: 'Mark range must have positive length',
    path: ['to'],
  })
})
