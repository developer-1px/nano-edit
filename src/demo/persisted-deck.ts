import {
  NanoDeckSchema,
  createNanoDeck,
  type NanoDeck,
  type NanoDeckEngine,
} from '../core/nano-core'
import type { DemoDocumentStorage } from './persisted-document'
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
  const storage = options.storage === undefined ? browserDemoDeckStorage() : options.storage
  const storageKey = options.storageKey ?? DEMO_DECK_STORAGE_KEY
  const initialDeck = options.initialDeck ?? initialNanoDeck
  const engine = createNanoDeck(readStoredDemoNanoDeck(storage, storageKey) ?? initialDeck)

  if (!storage) {
    return { engine, destroy() {} }
  }

  const unsubscribe = engine.subscribe(() => {
    writeStoredDemoNanoDeck(storage, storageKey, engine.value)
  })

  return {
    engine,
    destroy: unsubscribe,
  }
}

function browserDemoDeckStorage(): DemoDocumentStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredDemoNanoDeck(storage: DemoDocumentStorage | null, storageKey: string): NanoDeck | null {
  if (!storage) return null

  try {
    const stored = storage.getItem(storageKey)
    if (!stored) return null

    const parsed = NanoDeckSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeStoredDemoNanoDeck(
  storage: DemoDocumentStorage,
  storageKey: string,
  deck: NanoDeck,
): void {
  try {
    storage.setItem(storageKey, JSON.stringify(deck))
  } catch {
    // Persistence is best-effort; editing should keep working if storage is unavailable.
  }
}
