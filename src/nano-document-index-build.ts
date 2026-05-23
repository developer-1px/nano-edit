import { NanoDocumentSchema, type NanoDocument } from './nano-core'
import { resolveDocumentBacklinks } from './nano-document-index-backlinks'
import { indexDocumentBlock } from './nano-document-index-blocks'
import {
  createNanoDocumentIndexState,
  nanoDocumentIndexFromState,
} from './nano-document-index-state'
import type { NanoDocumentIndex } from './nano-document-index-types'

export { nanoDocumentIndexText } from './nano-document-index-text'

export function nanoDocumentIndex(document: NanoDocument): NanoDocumentIndex {
  const validDocument = NanoDocumentSchema.parse(document)
  const state = createNanoDocumentIndexState()

  for (const block of validDocument.blocks) {
    indexDocumentBlock(state, block)
  }

  resolveDocumentBacklinks(state)
  return nanoDocumentIndexFromState(state)
}
