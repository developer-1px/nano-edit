import { NanoDocumentSchema, type NanoDocument } from '../../core/nano-core'
import { resolveDocumentBacklinks } from './backlinks'
import { indexDocumentBlock } from './blocks'
import {
  createNanoDocumentIndexState,
  nanoDocumentIndexFromState,
} from './state'
import type { NanoDocumentIndex } from './types'

export { nanoDocumentIndexText } from './text'

export function nanoDocumentIndex(document: NanoDocument): NanoDocumentIndex {
  const validDocument = NanoDocumentSchema.parse(document)
  const state = createNanoDocumentIndexState()

  for (const block of validDocument.blocks) {
    indexDocumentBlock(state, block)
  }

  resolveDocumentBacklinks(state)
  return nanoDocumentIndexFromState(state)
}
