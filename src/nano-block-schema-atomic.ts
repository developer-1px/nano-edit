import { z } from 'zod'
import { NanoBlockIdSchema } from './nano-block-id-schema'

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

  addLengthIssue(ctx, 'align', block.align?.length, columnCount)
  addLengthIssue(ctx, 'separatorCells', block.separatorCells?.length, columnCount)
  addLengthIssue(ctx, 'leadingPipes', block.leadingPipes?.length, lineCount)
  addLengthIssue(ctx, 'trailingPipes', block.trailingPipes?.length, lineCount)
})

function addLengthIssue(
  ctx: z.RefinementCtx,
  path: string,
  actual: number | undefined,
  expected: number,
): void {
  if (actual === undefined || actual === expected) return

  ctx.addIssue({
    code: 'custom',
    message: `${path} length ${actual}; expected ${expected}`,
    path: [path],
  })
}

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
    href: z.string(),
    label: z.string().optional(),
    title: z.string().optional(),
    destinationStyle: z.enum(['angle']).optional(),
    syntax: z.enum(['autolink', 'bare', 'markdown']).optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('note_ref'),
    target: z.string(),
    alias: z.string().optional(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('tag_ref'),
    name: z.string(),
  }),
  z.object({
    id: NanoBlockIdSchema,
    type: z.literal('attachment'),
    src: z.string(),
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
    src: z.string(),
    alt: z.string().optional(),
    destinationStyle: z.enum(['angle']).optional(),
    title: z.string().optional(),
  }),
  TableBlockSchema,
]
