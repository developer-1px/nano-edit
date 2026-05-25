import { z } from 'zod'
import { NanoBlockIdSchema } from './nano-block-id-schema'
import {
  NonBlankStringSchema,
  addArrayLengthIssue,
} from './nano-block-schema-refinements'

const TableAlignSchema = z.enum(['left', 'center', 'right']).nullable()
const TableSeparatorCellSchema = z.string().regex(/^:?-{3,}:?$/)

const TableBlockSchema = z.object({
  id: NanoBlockIdSchema,
  type: z.literal('table'),
  rows: z.array(z.array(z.string()).min(2)).min(1),
  align: z.array(TableAlignSchema).optional(),
  leadingPipe: z.boolean().optional(),
  leadingPipes: z.array(z.boolean()).optional(),
  separatorCells: z.array(TableSeparatorCellSchema).optional(),
  trailingPipe: z.boolean().optional(),
  trailingPipes: z.array(z.boolean()).optional(),
}).superRefine((block, ctx) => {
  const columnCount = block.rows[0]?.length ?? 0
  const lineCount = block.rows.length + 1

  block.rows.forEach((row, index) => {
    if (row.length === columnCount) return
    ctx.addIssue({
      code: 'custom',
      message: `Table row ${index} has ${row.length} cells; expected ${columnCount}`,
      path: ['rows', index],
    })
  })

  addArrayLengthIssue(ctx, 'align', block.align?.length, columnCount)
  addArrayLengthIssue(ctx, 'separatorCells', block.separatorCells?.length, columnCount)
  addArrayLengthIssue(ctx, 'leadingPipes', block.leadingPipes?.length, lineCount)
  addArrayLengthIssue(ctx, 'trailingPipes', block.trailingPipes?.length, lineCount)
})

export const atomicBlockSchemas = [
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('code'),
    text: z.string(),
    language: z.string().optional(),
    fenceIndent: z.string().regex(/^[\t ]+$/).optional(),
    fenceInfoSpacing: z.string().regex(/^[\t ]+$/).optional(),
    fenceMarker: z.enum(['`', '~']).optional(),
    fenceLength: z.number().int().min(3).optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('math'),
    text: z.string(),
    mathStyle: z.enum(['single']).optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('bookmark'),
    href: NonBlankStringSchema,
    label: z.string().optional(),
    title: z.string().optional(),
    destinationStyle: z.enum(['angle']).optional(),
    syntax: z.enum(['autolink', 'bare', 'markdown']).optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('note_ref'),
    target: NonBlankStringSchema,
    alias: z.string().optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('tag_ref'),
    name: NonBlankStringSchema,
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('attachment'),
    src: NonBlankStringSchema,
    label: z.string().optional(),
    title: z.string().optional(),
    destinationStyle: z.enum(['angle']).optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('divider'),
    marker: z.enum(['---', '***', '___']).optional(),
    markerLength: z.number().int().min(3).optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('image'),
    src: NonBlankStringSchema,
    alt: z.string().optional(),
    destinationStyle: z.enum(['angle']).optional(),
    title: z.string().optional(),
  }),
  TableBlockSchema,
]
