import { createJSONDocument } from '@interactive-os/json-document'
import type { JSONDocument } from '@interactive-os/json-document'
import {
  createEmptyNanoDeck,
  NanoDeckSchema,
  type NanoDeck,
} from './nano-deck-model'

export type NanoDeckEngine = JSONDocument<NanoDeck>

export function createNanoDeck(initialDeck: NanoDeck = createEmptyNanoDeck()): NanoDeckEngine {
  return createJSONDocument(NanoDeckSchema, initialDeck, {
    history: 200,
  })
}
