import { createNanoDeck, type NanoDeckEngine } from '../entities/deck/nano-deck'
import { NanoDeckSchema, type NanoDeck } from '../entities/deck/nano-deck-model'
import {
  browserDemoPersistenceStorage,
  persistDemoEngine,
  readStoredDemoValue,
  type DemoPersistenceStorage,
} from './demo-persistence'
import { initialNanoDeck } from './initial-deck'

export const DEMO_DECK_STORAGE_KEY = 'nano-edit:demo-deck:v1'

export interface PersistedDemoNanoDeck {
  engine: NanoDeckEngine
  destroy(): void
}

interface PersistedDemoNanoDeckOptions {
  initialDeck?: NanoDeck
  storage?: DemoPersistenceStorage | null
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
