import {
  NanoDocumentSchema,
  nanoBlocksFromProseMirror,
  nanoDocumentFromMarkdown,
  nanoDocumentFromProseMirror,
  prosemirrorDocFromNano,
} from '../../src/index.ts'
import { nanoMarkFromProseMirrorMark } from '../../src/prosemirror-mark-codec-registry.ts'
import { nanoMarkNames } from '../../src/prosemirror-names.ts'
import { nanoNodeNames, nanoSchema } from '../../src/prosemirror-nano.ts'
import { assert, test } from './harness.mjs'

test('ProseMirror to Nano conversion returns a schema-valid document', () => {
  const source = nanoDocumentFromMarkdown([
    '# 현장 기록',
    '',
    '- [ ] 오전 메모 정리',
  ].join('\n'))
  const prosemirrorDoc = prosemirrorDocFromNano(source)
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(NanoDocumentSchema.parse(document), document)
  assert.deepEqual(nanoBlocksFromProseMirror(prosemirrorDoc), document.blocks)
})

test('ProseMirror table conversion pads ragged rows before schema validation', () => {
  const table = nanoSchema.nodes.table.create({
    id: 'table',
    rows: [['A'], ['1', '2']],
  })
  const prosemirrorDoc = nanoSchema.nodes.doc.create(null, [table])
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(document.blocks, [{
    id: 'table',
    type: 'table',
    rows: [['A', ''], ['1', '2']],
  }])
  assert.deepEqual(NanoDocumentSchema.parse(document), document)
})

test('ProseMirror conversion pads partial line source metadata before schema validation', () => {
  const nodes = nanoSchema.nodes
  const prosemirrorDoc = nodes[nanoNodeNames.doc].create(null, [
    nodes[nanoNodeNames.quote].create(
      { id: 'quote', quoteMarkerSpacing: ['none'], quoteMarkerDepths: [2] },
      nanoSchema.text('one\ntwo'),
    ),
    nodes[nanoNodeNames.callout].create(
      { id: 'callout', tone: 'tip', calloutMarkerSpacing: ['space'], calloutMarkerDepths: [2] },
      nanoSchema.text('head\nbody'),
    ),
    nodes[nanoNodeNames.listItem].create(
      { id: 'list', kind: 'bullet', continuationIndents: ['\t'], indent: 0, marker: '-' },
      nanoSchema.text('one\ntwo\nthree'),
    ),
    nodes[nanoNodeNames.todo].create(
      { id: 'todo', checked: false, continuationIndents: ['\t'], indent: 0, marker: '-' },
      nanoSchema.text('one\ntwo\nthree'),
    ),
    nodes[nanoNodeNames.footnote].create(
      { id: 'footnote', name: '1', footnoteContinuationIndents: ['\t'] },
      nanoSchema.text('one\ntwo\nthree'),
    ),
  ])
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(document.blocks, [
    {
      id: 'quote',
      type: 'quote',
      quoteMarkerSpacing: ['none', 'space'],
      quoteMarkerDepths: [2, 1],
      text: 'one\ntwo',
      marks: [],
    },
    {
      id: 'callout',
      type: 'callout',
      tone: 'tip',
      calloutMarkerDepths: [2, 1],
      calloutMarkerSpacing: ['space', 'space'],
      text: 'head\nbody',
      marks: [],
    },
    {
      id: 'list',
      type: 'list_item',
      kind: 'bullet',
      continuationIndents: ['\t', '  '],
      indent: 0,
      text: 'one\ntwo\nthree',
      marks: [],
    },
    {
      id: 'todo',
      type: 'todo',
      checked: false,
      continuationIndents: ['\t', '      '],
      indent: 0,
      text: 'one\ntwo\nthree',
      marks: [],
    },
    {
      id: 'footnote',
      type: 'footnote',
      footnoteContinuationIndents: ['\t', '    '],
      name: '1',
      text: 'one\ntwo\nthree',
      marks: [],
    },
  ])
  assert.deepEqual(NanoDocumentSchema.parse(document), document)
})

test('ProseMirror conversion drops blank reference marks before schema validation', () => {
  const marks = nanoSchema.marks

  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.tag].create({ name: '   ' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.noteLink].create({ target: '   ', alias: 'Alias' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.math].create({ formula: '   ' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.footnoteRef].create({ name: '   ' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.link].create({ href: '   ' }), 0, 1), null)
})

test('ProseMirror conversion degrades blank reference atoms before schema validation', () => {
  const nodes = nanoSchema.nodes
  const prosemirrorDoc = nodes[nanoNodeNames.doc].create(null, [
    nodes[nanoNodeNames.bookmark].create({ id: 'bookmark', href: '   ', label: 'Bookmark label' }),
    nodes[nanoNodeNames.noteRef].create({ id: 'note', target: '   ', alias: 'Note alias' }),
    nodes[nanoNodeNames.tagRef].create({ id: 'tag', name: '   ' }),
    nodes[nanoNodeNames.attachment].create({ id: 'attachment', src: '   ', label: 'Attachment label' }),
    nodes[nanoNodeNames.image].create({ id: 'image', src: '   ', alt: 'Image alt' }),
  ])
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(document.blocks, [
    { id: 'bookmark', type: 'paragraph', text: 'Bookmark label', marks: [] },
    { id: 'note', type: 'paragraph', text: 'Note alias', marks: [] },
    { id: 'tag', type: 'paragraph', text: '', marks: [] },
    { id: 'attachment', type: 'paragraph', text: 'Attachment label', marks: [] },
    { id: 'image', type: 'paragraph', text: 'Image alt', marks: [] },
  ])
  assert.deepEqual(NanoDocumentSchema.parse(document), document)
})
