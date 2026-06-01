import {
  createDocumentPersistence,
  defaultDocumentPersistenceCodec,
} from '@zod-crud/persist-web'
import type { JSONDocument } from 'zod-crud'

export interface DemoPersistenceStorage {
  getItem(key: string): string | null | undefined
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

interface DemoPersistenceSchema<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false }
}

export function browserDemoPersistenceStorage(): DemoPersistenceStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readStoredDemoValue<T>(
  storage: DemoPersistenceStorage | null,
  storageKey: string,
  schema: DemoPersistenceSchema<T>,
): T | null {
  if (!storage) return null

  try {
    const stored = storage.getItem(storageKey)
    if (!stored) return null

    const payload = defaultDocumentPersistenceCodec.decode(stored)
    const parsed = schema.safeParse(payload.value)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function persistDemoEngine<T>(
  engine: JSONDocument<T>,
  storage: DemoPersistenceStorage | null,
  storageKey: string,
): () => void {
  if (!storage) return () => {}

  const persistence = createDocumentPersistence(engine, {
    key: storageKey,
    host: storage,
  })
  return engine.subscribe(() => {
    void persistence.save()
  })
}

export function removeStaleDemoStorageKeys(
  storage: DemoPersistenceStorage | null,
  storageKeys: readonly string[],
): void {
  if (!storage?.removeItem) return

  for (const key of storageKeys) {
    try {
      storage.removeItem(key)
    } catch {
      // Stale demo cleanup is best-effort.
    }
  }
}
