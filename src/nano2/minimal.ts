import { z } from 'zod'
import { NanoBlockIdSchema } from '../entities/block/schema/nano-block-id-schema'
import type { NanoDocument } from '../entities/document/nano-document-model'

export const Nano2MinimalParagraphBlockSchema = z.object({
  id: NanoBlockIdSchema,
  type: z.literal('paragraph'),
  text: z.string(),
  marks: z.array(z.never()).length(0),
}).strict()

export const Nano2MinimalDocumentSchema = z.object({
  blocks: z.array(Nano2MinimalParagraphBlockSchema)
    .min(1)
    .superRefine((blocks, ctx) => {
      const seen = new Set<string>()
      for (const [index, block] of blocks.entries()) {
        if (!seen.has(block.id)) {
          seen.add(block.id)
          continue
        }
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate block id: ${block.id}`,
          path: [index, 'id'],
        })
      }
    }),
}).strict()

export function parseNano2MinimalDocument(document: unknown): NanoDocument {
  return Nano2MinimalDocumentSchema.parse(document) as NanoDocument
}

export function isNano2MinimalDocument(document: unknown): document is NanoDocument {
  return Nano2MinimalDocumentSchema.safeParse(document).success
}
