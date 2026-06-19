import { createNanoDocument, type NanoDocumentEngine } from '../entities/document/nano-document'
import { NanoDocumentSchema, type NanoDocument } from '../entities/document/nano-document-model'
import {
  browserDemoPersistenceStorage,
  persistDemoEngine,
  readStoredDemoValue,
  removeStaleDemoStorageKeys,
  staleVersionedStorageKeys,
  type DemoPersistenceStorage,
} from './demo-persistence'
import { initialNanoDocument } from './initial-document'

export const DEMO_DOCUMENT_STORAGE_KEY = 'nano-edit:demo-document:v11'
const STALE_DEMO_DOCUMENT_STORAGE_KEYS = staleVersionedStorageKeys(DEMO_DOCUMENT_STORAGE_KEY)

export interface PersistedDemoNanoDocument {
  engine: NanoDocumentEngine
  destroy(): void
}

interface PersistedDemoNanoDocumentOptions {
  initialDocument?: NanoDocument
  storage?: DemoPersistenceStorage | null
  storageKey?: string
}

export function createPersistedDemoNanoDocument(
  options?: DemoPersistenceStorage | PersistedDemoNanoDocumentOptions | null,
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
  options: DemoPersistenceStorage | PersistedDemoNanoDocumentOptions | null | undefined,
): Required<Pick<PersistedDemoNanoDocumentOptions, 'storage'>> & PersistedDemoNanoDocumentOptions {
  if (options === undefined) return { storage: browserDemoPersistenceStorage() }
  if (options === null) return { storage: null }
  if (!isDemoPersistenceStorage(options)) {
    return {
      ...options,
      storage: options.storage === undefined ? browserDemoPersistenceStorage() : options.storage,
    }
  }
  return { storage: options }
}

function isDemoPersistenceStorage(
  value: DemoPersistenceStorage | PersistedDemoNanoDocumentOptions,
): value is DemoPersistenceStorage {
  return 'getItem' in value
    && 'setItem' in value
    && typeof value.getItem === 'function'
    && typeof value.setItem === 'function'
}

function removeStaleDemoNanoDocuments(storage: DemoPersistenceStorage | null): void {
  removeStaleDemoStorageKeys(storage, STALE_DEMO_DOCUMENT_STORAGE_KEYS)
}
