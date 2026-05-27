import {
  createNanoDocument,
  NanoDocumentSchema,
  type NanoDocument,
  type NanoDocumentEngine,
} from '../core/nano-core'
import { initialNanoDocument } from './initial-document'

export const DEMO_DOCUMENT_STORAGE_KEY = 'nano-edit:demo-document:v10'
const STALE_DEMO_DOCUMENT_STORAGE_KEYS = [
  'nano-edit:demo-document:v1',
  'nano-edit:demo-document:v2',
  'nano-edit:demo-document:v3',
  'nano-edit:demo-document:v4',
  'nano-edit:demo-document:v5',
  'nano-edit:demo-document:v6',
  'nano-edit:demo-document:v7',
  'nano-edit:demo-document:v8',
  'nano-edit:demo-document:v9',
]

export type DemoDocumentStorage =
  Pick<Storage, 'getItem' | 'setItem'>
  & Partial<Pick<Storage, 'removeItem'>>

export interface PersistedDemoNanoDocument {
  engine: NanoDocumentEngine
  destroy(): void
}

export interface PersistedDemoNanoDocumentOptions {
  initialDocument?: NanoDocument
  storage?: DemoDocumentStorage | null
  storageKey?: string
}

export function createPersistedDemoNanoDocument(
  options?: DemoDocumentStorage | PersistedDemoNanoDocumentOptions | null,
): PersistedDemoNanoDocument {
  const config = persistedDemoNanoDocumentConfig(options)
  const storageKey = config.storageKey ?? DEMO_DOCUMENT_STORAGE_KEY
  const initialDocument = config.initialDocument ?? initialNanoDocument
  const storage = config.storage
  const engine = createNanoDocument(readStoredDemoNanoDocument(storage, storageKey) ?? initialDocument)
  removeStaleDemoNanoDocuments(storage)

  if (!storage) {
    return { engine, destroy() {} }
  }

  const unsubscribe = engine.subscribe(() => {
    writeStoredDemoNanoDocument(storage, storageKey, engine.value)
  })

  return {
    engine,
    destroy: unsubscribe,
  }
}

function persistedDemoNanoDocumentConfig(
  options: DemoDocumentStorage | PersistedDemoNanoDocumentOptions | null | undefined,
): Required<Pick<PersistedDemoNanoDocumentOptions, 'storage'>> & PersistedDemoNanoDocumentOptions {
  if (options === undefined) return { storage: browserDemoDocumentStorage() }
  if (options === null) return { storage: null }
  if (!isDemoDocumentStorage(options)) {
    return {
      ...options,
      storage: options.storage === undefined ? browserDemoDocumentStorage() : options.storage,
    }
  }
  return { storage: options }
}

function isDemoDocumentStorage(
  value: DemoDocumentStorage | PersistedDemoNanoDocumentOptions,
): value is DemoDocumentStorage {
  return 'getItem' in value
    && 'setItem' in value
    && typeof value.getItem === 'function'
    && typeof value.setItem === 'function'
}

function browserDemoDocumentStorage(): DemoDocumentStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredDemoNanoDocument(storage: DemoDocumentStorage | null, storageKey: string): NanoDocument | null {
  if (!storage) return null

  try {
    const stored = storage.getItem(storageKey)
    if (!stored) return null

    const parsed = NanoDocumentSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeStoredDemoNanoDocument(
  storage: DemoDocumentStorage,
  storageKey: string,
  document: NanoDocument,
): void {
  try {
    storage.setItem(storageKey, JSON.stringify(document))
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
