import {
  createPersistedDemoNanoDocument,
  DEMO_DOCUMENT_STORAGE_KEY,
} from '../../src/demo/persisted-document.ts'
import {
  createPersistedDemoNanoDeck,
  DEMO_DECK_STORAGE_KEY,
} from '../../src/demo/persisted-deck.ts'
import { initialNanoDocument } from '../../src/demo/initial-document.ts'
import { assert, test } from './harness.mjs'

class FakeStorage {
  constructor(entries = []) {
    this.values = new Map(entries)
    this.removes = []
    this.writes = []
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  setItem(key, value) {
    const stringValue = String(value)
    this.values.set(key, stringValue)
    this.writes.push([key, stringValue])
  }

  removeItem(key) {
    this.values.delete(key)
    this.removes.push(key)
  }
}

function storedValue(storage, key = DEMO_DOCUMENT_STORAGE_KEY) {
  const stored = storage.getItem(key)
  return stored ? JSON.parse(stored).value : null
}

function storedDocument(storage, key = DEMO_DOCUMENT_STORAGE_KEY) {
  return storedValue(storage, key)
}

test('Persisted demo document restores a valid stored document', () => {
  const restoredDocument = {
    blocks: [{ id: 'stored-1', type: 'paragraph', text: 'Saved note survives reload', marks: [] }],
  }
  const storage = new FakeStorage([
    [DEMO_DOCUMENT_STORAGE_KEY, JSON.stringify(restoredDocument)],
  ])

  const persisted = createPersistedDemoNanoDocument(storage)

  assert.deepEqual(persisted.engine.value, restoredDocument)
  persisted.destroy()
})

test('Persisted demo document falls back when stored data is invalid', () => {
  for (const storedValue of [
    '{',
    JSON.stringify({ blocks: [] }),
    JSON.stringify({ blocks: [{ id: '   ', type: 'paragraph', text: 'Blank id', marks: [] }] }),
    JSON.stringify({ blocks: [{ id: 'bad', type: 'unknown', text: 'bad', marks: [] }] }),
    JSON.stringify({
      blocks: [
        { id: 'same', type: 'paragraph', text: 'First', marks: [] },
        { id: 'same', type: 'paragraph', text: 'Second', marks: [] },
      ],
    }),
    JSON.stringify({
      blocks: [{
        id: 'bad-mark',
        type: 'paragraph',
        text: 'Short',
        marks: [{ type: 'bold', from: 0, to: 8 }],
      }],
    }),
  ]) {
    const storage = new FakeStorage([[DEMO_DOCUMENT_STORAGE_KEY, storedValue]])
    const persisted = createPersistedDemoNanoDocument(storage)

    assert.deepEqual(persisted.engine.value, initialNanoDocument)
    persisted.destroy()
  }
})

test('Persisted demo document ignores older demo storage versions', () => {
  const staleDocument = {
    blocks: [{ id: 'stale-1', type: 'paragraph', text: 'Old demo opening', marks: [] }],
  }
  const storage = new FakeStorage([
    ['nano-edit:demo-document:v1', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v2', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v3', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v4', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v5', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v6', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v7', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v8', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v9', JSON.stringify(staleDocument)],
    ['nano-edit:demo-document:v10', JSON.stringify(staleDocument)],
  ])

  const persisted = createPersistedDemoNanoDocument(storage)

  assert.deepEqual(persisted.engine.value, initialNanoDocument)
  assert.equal(storage.getItem('nano-edit:demo-document:v1'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v2'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v3'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v4'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v5'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v6'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v7'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v8'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v9'), null)
  assert.equal(storage.getItem('nano-edit:demo-document:v10'), null)
  assert.deepEqual(storage.removes, [
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
  ])
  persisted.destroy()
})

test('Persisted demo document ignores old per-document seeds after demo content changes', () => {
  const oldPartCatalog = {
    blocks: [{ id: 'old-part-catalog', type: 'heading', level: 1, text: 'Part Catalog', marks: [] }],
  }
  const contentCatalogSeed = {
    blocks: [{ id: 'content-catalog', type: 'heading', level: 1, text: 'Content Catalog', marks: [] }],
  }
  const storage = new FakeStorage([
    ['nano-edit:demo-document:v10:part-catalog', JSON.stringify(oldPartCatalog)],
  ])

  const persisted = createPersistedDemoNanoDocument({
    initialDocument: contentCatalogSeed,
    storage,
    storageKey: `${DEMO_DOCUMENT_STORAGE_KEY}:part-catalog`,
  })

  assert.deepEqual(persisted.engine.value, contentCatalogSeed)
  persisted.destroy()
})

test('Persisted demo document saves edits and stops saving after destroy', () => {
  const storage = new FakeStorage()
  const persisted = createPersistedDemoNanoDocument(storage)

  const committed = persisted.engine.commit(
    [{ op: 'replace', path: '/blocks/0/text', value: 'Saved note survives reload' }],
    { label: 'persist demo edit' },
  )

  assert.equal(committed.ok, true)
  assert.equal(storage.writes.length, 1)
  assert.equal(
    storedDocument(storage).blocks[0].text,
    'Saved note survives reload',
  )
  assert.equal(JSON.parse(storage.getItem(DEMO_DOCUMENT_STORAGE_KEY)).kind, 'zod-crud.persistence+json')

  persisted.destroy()

  const writeCount = storage.writes.length
  persisted.engine.commit(
    [{ op: 'replace', path: '/blocks/0/text', value: 'Edit after destroy' }],
    { label: 'post destroy edit' },
  )

  assert.equal(storage.writes.length, writeCount)
})

test('Persisted demo document can use a custom seed and storage key', () => {
  const storage = new FakeStorage()
  const customDocument = {
    blocks: [{ id: 'custom-1', type: 'paragraph', text: 'Custom document seed', marks: [] }],
  }
  const persisted = createPersistedDemoNanoDocument({
    initialDocument: customDocument,
    storage,
    storageKey: 'nano-edit:demo-document:test-custom',
  })

  assert.deepEqual(persisted.engine.value, customDocument)

  const committed = persisted.engine.commit(
    [{ op: 'replace', path: '/blocks/0/text', value: 'Custom document saved' }],
    { label: 'persist custom demo document edit' },
  )

  assert.equal(committed.ok, true)
  assert.equal(storage.getItem(DEMO_DOCUMENT_STORAGE_KEY), null)
  assert.equal(
    storedDocument(storage, 'nano-edit:demo-document:test-custom').blocks[0].text,
    'Custom document saved',
  )
  persisted.destroy()
})

test('Persisted demo deck uses zod-crud persistence envelopes', () => {
  const deck = {
    id: 'deck',
    title: 'Saved deck',
    slides: [{
      id: 'slide-1',
      layout: 'default',
      regions: [{
        id: 'slide-1-title',
        kind: 'title',
        blocks: [{ id: 'slide-title-block', type: 'heading', level: 1, text: 'Saved deck', marks: [] }],
      }],
    }],
  }
  const storage = new FakeStorage([[DEMO_DECK_STORAGE_KEY, JSON.stringify(deck)]])
  const persisted = createPersistedDemoNanoDeck({ storage })

  assert.deepEqual(persisted.engine.value, deck)

  const committed = persisted.engine.commit(
    [{ op: 'replace', path: '/title', value: 'Saved deck v2' }],
    { label: 'persist deck edit' },
  )

  assert.equal(committed.ok, true)
  assert.equal(storedValue(storage, DEMO_DECK_STORAGE_KEY).title, 'Saved deck v2')
  assert.equal(JSON.parse(storage.getItem(DEMO_DECK_STORAGE_KEY)).kind, 'zod-crud.persistence+json')
  persisted.destroy()
})
