import { createJSONDocument } from 'zod-crud'
import type { JSONDocument } from 'zod-crud'
import { z } from 'zod'
import { NanoBlockSchema } from './nano-block-schema'
import { NanoMarkSchema } from './nano-mark-schema'
import {
  blockTextPointer,
  point,
} from './nano-selection-core'

export { NanoBlockSchema } from './nano-block-schema'
export { NanoMarkSchema } from './nano-mark-schema'
export {
  blockTextPointer,
  blocksPointer,
  point,
  pointOffset,
  pointPath,
  replaceBlocksPatch,
  selectionSnap,
} from './nano-selection-core'

export const NanoDocumentSchema = z.object({
  blocks: z.array(NanoBlockSchema),
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
