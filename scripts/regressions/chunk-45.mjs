import {
  createEmptyNanoDocument,
  createNanoDocument,
  emptyNanoDocument,
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
