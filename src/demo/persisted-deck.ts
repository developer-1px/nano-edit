import {
  NanoDeckSchema,
  createNanoDeck,
  type NanoDeck,
  type NanoDeckEngine,
} from '../core/nano-core'
import type { DemoDocumentStorage } from './persisted-document'
import {
  browserDemoPersistenceStorage,
  persistDemoEngine,
  readStoredDemoValue,
} from './demo-persistence'
import { initialNanoDeck } from './initial-deck'

export const DEMO_DECK_STORAGE_KEY = 'nano-edit:demo-deck:v1'

export interface PersistedDemoNanoDeck {
  engine: NanoDeckEngine
  destroy(): void
}

export interface PersistedDemoNanoDeckOptions {
  initialDeck?: NanoDeck
  storage?: DemoDocumentStorage | null
  storageKey?: string
}

export function createPersistedDemoNanoDeck(
  options: PersistedDemoNanoDeckOptions = {},
): PersistedDemoNanoDeck {
  const storage = options.storage === undefined ? browserDemoPersistenceStorage() : options.storage
  const storageKey = options.storageKey ?? DEMO_DECK_STORAGE_KEY
  const initialDeck = options.initialDeck ?? initialNanoDeck
  const engine = createNanoDeck(readStoredDemoValue(storage, storageKey, NanoDeckSchema) ?? initialDeck)

  return {
    engine,
    destroy: persistDemoEngine(engine, storage, storageKey),
  }
}
