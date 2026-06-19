import {
  createDocumentPersistence,
  defaultDocumentPersistenceCodec,
} from '@interactive-os/json-document-persist-web'
import { createNanoDocument, type NanoDocumentEngine } from '../../entities/document/nano-document'
import { NanoDocumentSchema, type NanoDocument } from '../../entities/document/nano-document-model'

export const NANO2_EXAMPLE_STORAGE_KEY_PREFIX = 'nano-edit:nano2-example:v1'

export interface PersistedNano2ExampleDocument {
  engine: NanoDocumentEngine
  destroy(): void
}

export function nano2ExampleStorageKey(exampleId: string): string {
  return `${NANO2_EXAMPLE_STORAGE_KEY_PREFIX}:${exampleId}`
}

export function createPersistedNano2ExampleDocument(options: {
  initialDocument: NanoDocument
  parseDocument?: (document: unknown) => NanoDocument
  storageKey: string
}): PersistedNano2ExampleDocument {
  const storage = browserStorage()
  const initialDocument = options.parseDocument
    ? options.parseDocument(options.initialDocument)
    : options.initialDocument
  const engine = createNanoDocument(
    readStoredNano2Document(storage, options.storageKey, options.parseDocument) ?? initialDocument,
  )

  if (!storage) {
    return {
      engine,
      destroy: () => {},
    }
  }

  const persistence = createDocumentPersistence(engine, {
    key: options.storageKey,
    host: storage,
  })
  const unsubscribe = engine.subscribe(() => {
    void persistence.save()
  })

  return {
    engine,
    destroy: unsubscribe,
  }
}

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredNano2Document(
  storage: Storage | null,
  storageKey: string,
  parseDocument: ((document: unknown) => NanoDocument) | undefined,
): NanoDocument | null {
  if (!storage) return null

  try {
    const stored = storage.getItem(storageKey)
    if (!stored) return null

    const payload = defaultDocumentPersistenceCodec.decode(stored)
    if (parseDocument) return parseDocument(payload.value)

    const parsed = NanoDocumentSchema.safeParse(payload.value)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
