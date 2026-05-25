import {
  NanoDocumentSchema,
  nanoBlocksFromProseMirror,
  nanoDocumentFromMarkdown,
  nanoDocumentFromProseMirror,
  prosemirrorDocFromNano,
} from '../../src/index.ts'
import { imageNodeSpec } from '../../src/adapters/prosemirror/prosemirror-image-node-spec.ts'
import { linkMarkSpec } from '../../src/adapters/prosemirror/prosemirror-link-mark-spec.ts'
import { nanoMarkFromProseMirrorMark } from '../../src/adapters/prosemirror/prosemirror-mark-codec-registry.ts'
import { nanoMarkNames } from '../../src/adapters/prosemirror/prosemirror-names.ts'
import { nanoNodeNames, nanoSchema } from '../../src/adapters/prosemirror/prosemirror-nano.ts'
import {
  attachmentNodeSpec,
  bookmarkNodeSpec,
  noteRefNodeSpec,
  tagRefNodeSpec,
} from '../../src/adapters/prosemirror/prosemirror-reference-node-specs.ts'
import { referenceMarkSpecs } from '../../src/adapters/prosemirror/prosemirror-reference-mark-specs.ts'
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
  assert.deepEqual(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.link].create({ href: '  https://example.com  ' }), 0, 4), {
    type: 'link',
    from: 0,
    to: 4,
    href: 'https://example.com',
  })
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

  const trimmed = nanoDocumentFromProseMirror(nodes[nanoNodeNames.doc].create(null, [
    nodes[nanoNodeNames.bookmark].create({ id: 'trimmed-bookmark', href: '  https://example.com  ' }),
    nodes[nanoNodeNames.noteRef].create({ id: 'trimmed-note', target: '  Note Title  ' }),
    nodes[nanoNodeNames.attachment].create({ id: 'trimmed-attachment', src: '  file.pdf  ' }),
    nodes[nanoNodeNames.image].create({ id: 'trimmed-image', src: '  image.png  ' }),
  ]))

  assert.deepEqual(trimmed.blocks, [
    { id: 'trimmed-bookmark', type: 'bookmark', href: 'https://example.com' },
    { id: 'trimmed-note', type: 'note_ref', target: 'Note Title' },
    { id: 'trimmed-attachment', type: 'attachment', src: 'file.pdf' },
    { id: 'trimmed-image', type: 'image', src: 'image.png' },
  ])
  assert.deepEqual(NanoDocumentSchema.parse(trimmed), trimmed)
})

test('ProseMirror DOM parsing rejects blank reference marks before attr creation', () => {
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.tag], element({ dataset: { tag: '   ' } })), false)
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.noteLink], element({ dataset: { target: '   ' } })), false)
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.math], element({ dataset: { formula: '   ' } })), false)
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.footnoteRef], element({ dataset: { name: '   ' } })), false)
  assert.equal(parseAttrs(linkMarkSpec, element({ attrs: { href: '   ' } })), false)

  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.tag], element({ dataset: { tag: '  release  ' } })), { name: 'release' })
  assert.deepEqual(parseAttrs(linkMarkSpec, element({ attrs: { href: '  https://example.com  ' } })), {
    href: 'https://example.com',
    destinationStyle: '',
    title: '',
    syntax: '',
    image: false,
    imageEmptyAlt: false,
  })
})

test('ProseMirror DOM parsing falls back when reference datasets are blank', () => {
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.tag], element({
    dataset: { tag: '   ' },
    textContent: '#fallback',
  })), { name: 'fallback' })
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.noteLink], element({
    dataset: { target: '   ' },
    textContent: '[[Fallback Note|Alias]]',
  })), { target: 'Fallback Note', alias: 'Alias' })
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.math], element({
    dataset: { formula: '   ' },
    textContent: 'x + y',
  })), { formula: 'x + y' })
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.footnoteRef], element({
    dataset: { name: '   ' },
    textContent: '[^source]',
  })), { name: 'source' })
  assert.deepEqual(parseAttrs(linkMarkSpec, element({
    attrs: { href: '   ' },
    dataset: { href: 'https://fallback.example' },
  })), {
    href: 'https://fallback.example',
    destinationStyle: '',
    title: '',
    syntax: '',
    image: false,
    imageEmptyAlt: false,
  })
})

test('ProseMirror DOM parsing rejects blank reference atoms before attr creation', () => {
  assert.equal(parseAttrs(bookmarkNodeSpec, element({ dataset: { href: '   ' } })), false)
  assert.equal(parseAttrs(noteRefNodeSpec, element({ dataset: { target: '   ' } })), false)
  assert.equal(parseAttrs(tagRefNodeSpec, element({ dataset: { tag: '   ' } })), false)
  assert.equal(parseAttrs(attachmentNodeSpec, element({ dataset: { src: '   ' } })), false)
  assert.equal(parseAttrs(imageNodeSpec, element({ query: { img: element({ attrs: { src: '   ' } }) } })), false)
  assert.equal(parseAttrs(imageNodeSpec, element({ attrs: { src: '   ' } }), 1), false)

  assert.deepEqual(parseAttrs(bookmarkNodeSpec, element({ dataset: { href: '  https://example.com  ', label: 'Example' } })), {
    href: 'https://example.com',
    label: 'Example',
    title: '',
    destinationStyle: '',
    syntax: 'bare',
  })
  assert.deepEqual(parseAttrs(imageNodeSpec, element({ attrs: { src: '  /image.png  ', alt: 'Image' } }), 1), {
    src: '/image.png',
    alt: 'Image',
    title: '',
  })
})

test('ProseMirror DOM parsing falls back when reference atom datasets are blank', () => {
  assert.deepEqual(parseAttrs(bookmarkNodeSpec, element({
    dataset: { href: '   ' },
    query: { a: element({ attrs: { href: 'https://fallback.example' } }) },
  })), {
    href: 'https://fallback.example',
    label: '',
    title: '',
    destinationStyle: '',
    syntax: 'bare',
  })
  assert.deepEqual(parseAttrs(noteRefNodeSpec, element({
    dataset: { target: '   ' },
    textContent: '[[Fallback Note|Alias]]',
  })), { target: 'Fallback Note', alias: 'Alias' })
  assert.deepEqual(parseAttrs(tagRefNodeSpec, element({
    dataset: { tag: '   ' },
    textContent: '#fallback',
  })), { name: 'fallback' })
  assert.deepEqual(parseAttrs(attachmentNodeSpec, element({
    dataset: { src: '   ' },
    query: { a: element({ attrs: { href: 'fallback.pdf' } }) },
  })), {
    src: 'fallback.pdf',
    label: '',
    title: '',
    destinationStyle: '',
  })
})

function parseAttrs(spec, dom, ruleIndex = 0) {
  return spec.parseDOM[ruleIndex].getAttrs(dom)
}

function element({ dataset = {}, attrs = {}, textContent = '', query = {} } = {}) {
  return {
    dataset,
    textContent,
    getAttribute: (name) => attrs[name] ?? null,
    querySelector: (selector) => query[selector] ?? null,
  }
}
