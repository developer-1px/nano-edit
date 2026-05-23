import {
  createEmptyNanoDocument,
  createNanoDocument,
  emptyNanoDocument,
  NanoBlockSchema,
  NanoDocumentSchema,
  NanoMarkSchema,
} from '../../src/index.ts'
import { assert, test } from './harness.mjs'

test('Default Nano documents are fresh and isolated from exported empty state', () => {
  const first = createEmptyNanoDocument()
  const second = createEmptyNanoDocument()

  assert.notEqual(first, second)
  assert.notEqual(first.blocks, second.blocks)

  first.blocks[0].text = 'changed'
  assert.equal(second.blocks[0].text, '')

  const originalText = emptyNanoDocument.blocks[0].text
  try {
    emptyNanoDocument.blocks[0].text = 'consumer mutation'
    assert.equal(createNanoDocument().value.blocks[0].text, '')
  } finally {
    emptyNanoDocument.blocks[0].text = originalText
  }
})

test('Nano document schema rejects empty and duplicate block collections', () => {
  assert.equal(NanoDocumentSchema.safeParse({ blocks: [] }).success, false)
  assert.equal(NanoDocumentSchema.safeParse({
    blocks: [
      { id: 'same', type: 'paragraph', text: 'One', marks: [] },
      { id: 'same', type: 'paragraph', text: 'Two', marks: [] },
    ],
  }).success, false)
})

test('Nano schema rejects blank ids and invalid mark ranges before runtime', () => {
  assert.equal(NanoBlockSchema.safeParse({
    id: '   ',
    type: 'paragraph',
    text: 'Blank id',
    marks: [],
  }).success, false)
  assert.equal(NanoMarkSchema.safeParse({
    type: 'bold',
    from: 2,
    to: 2,
  }).success, false)
  assert.equal(NanoMarkSchema.safeParse({
    type: 'italic',
    from: 4,
    to: 2,
  }).success, false)
  assert.equal(NanoDocumentSchema.safeParse({
    blocks: [{
      id: 'one',
      type: 'paragraph',
      text: 'Short',
      marks: [{ type: 'bold', from: 0, to: 8 }],
    }],
  }).success, false)
})
