import {
  createEmptyNanoDocument,
  createNanoDocument,
  emptyNanoDocument,
  NanoBlockSchema,
  NanoDocumentSchema,
  NanoMarkSchema,
  nanoDocumentFromMarkdown,
  prosemirrorDocFromNano,
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

test('Markdown parser returns a schema-valid Nano document', () => {
  const document = nanoDocumentFromMarkdown([
    '# 현장 기록',
    '',
    '오늘은 **비 냄새**와 ==과일 상자==를 남긴다.',
    '',
    '- [x] 오전 메모 정리',
    '- [ ] 금요일 일정 다시 확인',
    '',
    '[[시장 골목]]과 #notes',
  ].join('\n'))

  const parsed = NanoDocumentSchema.safeParse(document)
  assert.equal(parsed.success, true)
  assert.deepEqual(parsed.data, document)
})

test('ProseMirror conversion rejects invalid Nano documents instead of repairing them', () => {
  assert.throws(() => prosemirrorDocFromNano({
    blocks: [],
  }))
  assert.throws(() => prosemirrorDocFromNano({
    blocks: [{ id: '   ', type: 'paragraph', text: '', marks: [] }],
  }))
})
