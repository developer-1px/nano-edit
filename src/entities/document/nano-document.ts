import { createJSONDocument } from '@interactive-os/json-document'
import type { JSONDocument } from '@interactive-os/json-document'
import {
  createEmptyNanoDocument,
  NanoDocumentSchema,
  type NanoDocument,
} from './nano-document-model'
import {
  blockTextPointer,
  point,
} from './nano-document-selection'

export type NanoDocumentEngine = JSONDocument<NanoDocument>

export function createNanoDocument(initialDocument: NanoDocument = createEmptyNanoDocument()): NanoDocumentEngine {
  return createJSONDocument(NanoDocumentSchema, initialDocument, {
    history: 200,
    selection: {
      mode: 'extended',
      initial: [point(blockTextPointer(0), 0)],
    },
  })
}
