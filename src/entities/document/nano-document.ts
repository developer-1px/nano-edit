import { createJSONDocument } from 'zod-crud'
import type { JSONDocument } from 'zod-crud'
import { z } from 'zod'
import { NanoBlockSchema } from '../block/schema/nano-block-schema'
import { NanoMarkSchema } from '../mark/nano-mark-schema'
import {
  blockTextPointer,
  point,
} from './nano-document-selection'

export { NanoBlockSchema } from '../block/schema/nano-block-schema'
export { NanoMarkSchema } from '../mark/nano-mark-schema'
export {
  blockTextPointer,
  blocksPointer,
  point,
  pointOffset,
  pointPath,
  replaceBlocksPatch,
  selectionSnap,
} from './nano-document-selection'

const NanoDocumentBlocksSchema = z.array(NanoBlockSchema)
  .min(1)
  .superRefine((blocks, ctx) => {
    const seen = new Set<string>()
    for (const [index, block] of blocks.entries()) {
      if (!seen.has(block.id)) {
        seen.add(block.id)
      } else {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate block id: ${block.id}`,
          path: [index, 'id'],
        })
      }

      if (!('text' in block) || !('marks' in block)) continue

      for (const [markIndex, mark] of block.marks.entries()) {
        if (mark.to <= block.text.length) continue

        ctx.addIssue({
          code: 'custom',
          message: `Mark range exceeds block text length: ${mark.to} > ${block.text.length}`,
          path: [index, 'marks', markIndex, 'to'],
        })
      }
    }
  })

export const NanoDocumentSchema = z.object({
  blocks: NanoDocumentBlocksSchema,
})

export type NanoMark = z.infer<typeof NanoMarkSchema>
export type NanoBlock = z.infer<typeof NanoBlockSchema>
export type NanoDocument = z.infer<typeof NanoDocumentSchema>
export type NanoDocumentEngine = JSONDocument<NanoDocument>

export function createEmptyNanoDocument(): NanoDocument {
  return {
    blocks: [{ id: 'b1', type: 'paragraph', text: '', marks: [] }],
  }
}

export const emptyNanoDocument: NanoDocument = createEmptyNanoDocument()

export function createNanoDocument(initialDocument: NanoDocument = createEmptyNanoDocument()): NanoDocumentEngine {
  return createJSONDocument(NanoDocumentSchema, initialDocument, {
    history: 200,
    selection: {
      mode: 'extended',
      initial: [point(blockTextPointer(0), 0)],
    },
  })
}
