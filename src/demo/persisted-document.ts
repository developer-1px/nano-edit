import {
  createNanoDocument,
  NanoDocumentSchema,
  type NanoDocument,
  type NanoDocumentEngine,
} from '../core/nano-core'
import {
  browserDemoPersistenceStorage,
  persistDemoEngine,
  readStoredDemoValue,
  removeStaleDemoStorageKeys,
  type DemoPersistenceStorage,
} from './demo-persistence'
import { initialNanoDocument } from './initial-document'

export const DEMO_DOCUMENT_STORAGE_KEY = 'nano-edit:demo-document:v11'
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
  'nano-edit:demo-document:v10',
]

export type DemoDocumentStorage = DemoPersistenceStorage

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
  const engine = createNanoDocument(readStoredDemoValue(storage, storageKey, NanoDocumentSchema) ?? initialDocument)
  removeStaleDemoNanoDocuments(storage)

  return {
    engine,
    destroy: persistDemoEngine(engine, storage, storageKey),
  }
}

function persistedDemoNanoDocumentConfig(
  options: DemoDocumentStorage | PersistedDemoNanoDocumentOptions | null | undefined,
): Required<Pick<PersistedDemoNanoDocumentOptions, 'storage'>> & PersistedDemoNanoDocumentOptions {
  if (options === undefined) return { storage: browserDemoPersistenceStorage() }
  if (options === null) return { storage: null }
  if (!isDemoDocumentStorage(options)) {
    return {
      ...options,
      storage: options.storage === undefined ? browserDemoPersistenceStorage() : options.storage,
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

function removeStaleDemoNanoDocuments(storage: DemoDocumentStorage | null): void {
  removeStaleDemoStorageKeys(storage, STALE_DEMO_DOCUMENT_STORAGE_KEYS)
}
