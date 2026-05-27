import {
  createPersistedDemoNanoDocument,
  DEMO_DOCUMENT_STORAGE_KEY,
} from '../../src/demo/persisted-document.ts'
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
  ])
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
    JSON.parse(storage.getItem(DEMO_DOCUMENT_STORAGE_KEY)).blocks[0].text,
    'Saved note survives reload',
  )

  persisted.destroy()

  const writeCount = storage.writes.length
  persisted.engine.commit(
    [{ op: 'replace', path: '/blocks/0/text', value: 'Edit after destroy' }],
    { label: 'post destroy edit' },
  )

  assert.equal(storage.writes.length, writeCount)
})
