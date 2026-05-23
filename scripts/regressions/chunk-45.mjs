import {
  createEmptyNanoDocument,
  createNanoDocument,
  emptyNanoDocument,
  NanoBlockSchema,
  NanoDocumentSchema,
  NanoMarkSchema,
  nanoDocumentFromMarkdown,
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
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

test('Nano schema rejects blank reference targets before runtime', () => {
  for (const block of [
    { id: 'bookmark', type: 'bookmark', href: '   ' },
    { id: 'note', type: 'note_ref', target: '   ' },
    { id: 'tag', type: 'tag_ref', name: '   ' },
    { id: 'attachment', type: 'attachment', src: '   ' },
    { id: 'image', type: 'image', src: '   ' },
    { id: 'footnote', type: 'footnote', name: '   ', text: '', marks: [] },
  ]) {
    assert.equal(NanoBlockSchema.safeParse(block).success, false)
  }

  for (const mark of [
    { type: 'tag', name: '   ', from: 0, to: 1 },
    { type: 'note_link', target: '   ', from: 0, to: 1 },
    { type: 'math', formula: '   ', from: 0, to: 1 },
    { type: 'footnote_ref', name: '   ', from: 0, to: 1 },
    { type: 'link', href: '   ', from: 0, to: 1 },
  ]) {
    assert.equal(NanoMarkSchema.safeParse(mark).success, false)
  }
})

test('Nano schema rejects malformed table block structure before runtime', () => {
  assert.equal(NanoBlockSchema.safeParse({
    id: 'table',
    type: 'table',
    rows: [],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'table',
    type: 'table',
    rows: [['Only one column']],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'table',
    type: 'table',
    rows: [['A', 'B'], ['1']],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'table',
    type: 'table',
    rows: [['A', 'B']],
    align: ['left'],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'table',
    type: 'table',
    rows: [['A', 'B']],
    leadingPipes: [true],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'table',
    type: 'table',
    rows: [['A', 'B']],
    separatorCells: ['--', '---'],
  }).success, false)
})

test('Nano schema rejects source metadata arrays that do not match text lines', () => {
  assert.equal(NanoBlockSchema.safeParse({
    id: 'quote',
    type: 'quote',
    text: 'one\ntwo',
    marks: [],
    quoteMarkerSpacing: ['space'],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'callout',
    type: 'callout',
    tone: 'tip',
    text: 'one\ntwo',
    marks: [],
    calloutMarkerDepths: [1],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'list',
    type: 'list_item',
    kind: 'bullet',
    indent: 0,
    text: 'one\ntwo\nthree',
    marks: [],
    continuationIndents: ['  '],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'todo',
    type: 'todo',
    checked: false,
    indent: 0,
    text: 'one',
    marks: [],
    continuationIndents: [],
  }).success, false)
  assert.equal(NanoBlockSchema.safeParse({
    id: 'footnote',
    type: 'footnote',
    name: '1',
    text: 'one\ntwo',
    marks: [],
    footnoteContinuationIndents: ['    ', '\t'],
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

test('Markdown serializers reject invalid Nano documents instead of stringifying them', () => {
  assert.throws(() => nanoMarkdownFromDocument({
    blocks: [],
  }))
  assert.throws(() => nanoMarkdownBlocksFromDocument({
    blocks: [{ id: 'bad', type: 'paragraph', text: 'Short', marks: [{ type: 'bold', from: 0, to: 10 }] }],
  }))
})
