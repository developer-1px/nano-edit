import {
  createNanoDocument,
  NanoDocumentSchema,
  type NanoDocument,
  type NanoDocumentEngine,
} from '../nano-core'
import { initialNanoDocument } from './initial-document'

export const DEMO_DOCUMENT_STORAGE_KEY = 'nano-edit:demo-document:v2'
const STALE_DEMO_DOCUMENT_STORAGE_KEYS = ['nano-edit:demo-document:v1']

export type DemoDocumentStorage =
  Pick<Storage, 'getItem' | 'setItem'>
  & Partial<Pick<Storage, 'removeItem'>>

export interface PersistedDemoNanoDocument {
  engine: NanoDocumentEngine
  destroy(): void
}

export function createPersistedDemoNanoDocument(
  storage: DemoDocumentStorage | null = browserDemoDocumentStorage(),
): PersistedDemoNanoDocument {
  const engine = createNanoDocument(readStoredDemoNanoDocument(storage) ?? initialNanoDocument)
  removeStaleDemoNanoDocuments(storage)

  if (!storage) {
    return { engine, destroy() {} }
  }

  const unsubscribe = engine.subscribe(() => {
    writeStoredDemoNanoDocument(storage, engine.value)
  })

  return {
    engine,
    destroy: unsubscribe,
  }
}

function browserDemoDocumentStorage(): DemoDocumentStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredDemoNanoDocument(storage: DemoDocumentStorage | null): NanoDocument | null {
  if (!storage) return null

  try {
    const stored = storage.getItem(DEMO_DOCUMENT_STORAGE_KEY)
    if (!stored) return null

    const parsed = NanoDocumentSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeStoredDemoNanoDocument(
  storage: DemoDocumentStorage,
  document: NanoDocument,
): void {
  try {
    storage.setItem(DEMO_DOCUMENT_STORAGE_KEY, JSON.stringify(document))
  } catch {
    // Persistence is best-effort; editing should keep working if storage is unavailable.
  }
}

function removeStaleDemoNanoDocuments(storage: DemoDocumentStorage | null): void {
  if (!storage?.removeItem) return

  for (const key of STALE_DEMO_DOCUMENT_STORAGE_KEYS) {
    try {
      storage.removeItem(key)
    } catch {
      // Stale demo cleanup is best-effort.
    }
  }
}
