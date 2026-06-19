import {
  setBlockType,
  toggleMark,
} from 'prosemirror-commands'
import { TextSelection } from 'prosemirror-state'
import {
  nanoDocumentChangeFromProseMirrorDoc,
  nanoDocumentFromProseMirror,
  prosemirrorDocFromNano,
} from '../../src/adapters/prosemirror/prosemirror-document.ts'
import {
  nanoMarkNames,
  nanoNodeNames,
} from '../../src/adapters/prosemirror/prosemirror-names.ts'
import { mentionNodeSpec } from '../../src/adapters/prosemirror/prosemirror-reference-node-specs.ts'
import { nanoSchema } from '../../src/adapters/prosemirror/prosemirror-schema.ts'
import { commitNanoDocumentChange } from '../../src/entities/document/nano-document-change.ts'
import { createNanoDocument } from '../../src/entities/document/nano-document.ts'
import { NanoDocumentSchema } from '../../src/entities/document/nano-document-model.ts'
import { nanoMarkdownFromDocument } from '../../src/codecs/markdown/nano-markdown.ts'
import { nano2SetImageTransaction } from '../../src/nano2/images.ts'
import { nano2MarkdownShortcutTransaction } from '../../src/nano2/markdown-shortcuts.ts'
import { nano2ToggleTodoTransaction } from '../../src/nano2/tasks.ts'
import { assert, EditorState, test } from './harness.mjs'

test('Nano2 P0 basics: mark command commits canonical NanoDocument history', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Hello Nano2', marks: [] }],
  }
  const engine = createNanoDocument(initial)
  const state = EditorState.create({
    schema: nanoSchema,
    doc: prosemirrorDocFromNano(engine.value),
    selection: TextSelection.create(prosemirrorDocFromNano(engine.value), 7, 12),
  })
  let transaction = null

  assert.equal(toggleMark(nanoSchema.marks[nanoMarkNames.bold])(state, (tr) => { transaction = tr }), true)
  assert(transaction)

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-p0-toggle-bold',
    origin: 'nano2-headless-p0',
  })
  assert(change)
  assert.equal(change.origin, 'nano2-headless-p0')
  assert(change.operations.some((operation) => operation.path.startsWith('/blocks/0')))
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)

  assert.deepEqual(engine.value.blocks[0].marks, [{ type: 'bold', from: 6, to: 11 }])
  assert.deepEqual(NanoDocumentSchema.parse(engine.value), engine.value)

  assert.equal(Boolean(engine.history.undo()), true)
  assert.deepEqual(engine.value, initial)
  assert.equal(Boolean(engine.history.redo()), true)
  assert.deepEqual(engine.value.blocks[0].marks, [{ type: 'bold', from: 6, to: 11 }])
})

test('Nano2 P0 basics: heading command is a NanoDocument block change', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Section title', marks: [] }],
  }
  const doc = prosemirrorDocFromNano(initial)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1),
  })
  let transaction = null

  assert.equal(setBlockType(nanoSchema.nodes[nanoNodeNames.heading], { level: 2 })(state, (tr) => { transaction = tr }), true)
  assert(transaction)

  const next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next, {
    blocks: [{ id: 'b1', type: 'heading', text: 'Section title', marks: [], level: 2 }],
  })

  const change = nanoDocumentChangeFromProseMirrorDoc(initial, transaction.doc, {
    label: 'nano2-p0-heading',
    origin: 'nano2-headless-p0',
  })
  assert(change)
  assert(change.operations.some((operation) => operation.path.startsWith('/blocks/0')))
})

test('Nano2 P0 dinos: mention chip is a schema-valid custom inline semantic atom', () => {
  const document = {
    blocks: [{
      id: 'b1',
      type: 'paragraph',
      text: 'Owner \ufffc ships',
      marks: [{ type: 'mention', from: 6, to: 7, id: 'mina', label: 'Mina' }],
    }],
  }

  assert.deepEqual(NanoDocumentSchema.parse(document), document)
  assert.equal(nanoSchema.nodes[nanoNodeNames.mention].spec.atom, true)
  assert.equal(nanoSchema.nodes[nanoNodeNames.mention].spec.inline, true)
  assert.equal(nanoSchema.nodes[nanoNodeNames.mention].spec.selectable, true)
  assert.equal(nanoSchema.nodes[nanoNodeNames.mention].spec.draggable, true)
  assert.equal(mentionNodeSpec.leafText?.(nanoSchema.nodes[nanoNodeNames.mention].create({ id: 'mina', label: 'Mina' })), '\ufffc')

  const prosemirrorDoc = prosemirrorDocFromNano(document)
  const paragraph = prosemirrorDoc.firstChild
  const mention = paragraph?.child(1)

  assert.equal(mention?.type.name, nanoNodeNames.mention)
  assert.equal(mention?.attrs.id, 'mina')
  assert.equal(mention?.attrs.label, 'Mina')
  assert.deepEqual(nanoDocumentFromProseMirror(prosemirrorDoc), document)
})

test('Nano2 P0 dinos: inserted inline atom lowers to one-character json-document mark', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'A B', marks: [] }],
  }
  const doc = prosemirrorDocFromNano(initial)
  const mention = nanoSchema.nodes[nanoNodeNames.mention].create({ id: 'avery', label: 'Avery' })
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 3),
  })
  const transaction = state.tr.replaceSelectionWith(mention)
  const next = nanoDocumentFromProseMirror(transaction.doc)

  assert.deepEqual(next.blocks[0], {
    id: 'b1',
    type: 'paragraph',
    text: 'A \ufffcB',
    marks: [{ type: 'mention', from: 2, to: 3, id: 'avery', label: 'Avery' }],
  })
  assert.equal(next.blocks[0].marks[0].to - next.blocks[0].marks[0].from, 1)
  assert.equal(next.blocks[0].text.codePointAt(next.blocks[0].marks[0].from), 0xfffc)
})

test('Nano2 T0 StarterKit: hard break round-trips as NanoDocument newline', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'AB', marks: [] }],
  }
  const doc = prosemirrorDocFromNano(initial)
  const hardBreak = nanoSchema.nodes[nanoNodeNames.hardBreak].create()
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 2),
  })
  const transaction = state.tr.replaceSelectionWith(hardBreak)
  const next = nanoDocumentFromProseMirror(transaction.doc)

  assert.deepEqual(next.blocks[0], {
    id: 'b1',
    type: 'paragraph',
    text: 'A\nB',
    marks: [],
  })
  assert.equal(transaction.doc.firstChild.child(1).type.name, nanoNodeNames.hardBreak)
  assert.deepEqual(prosemirrorDocFromNano(next).firstChild.child(1).type.name, nanoNodeNames.hardBreak)
  assert.deepEqual(NanoDocumentSchema.parse(next), next)
})

test('Nano2 T0 StarterKit: common marks lower to Nano mark ranges', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'underline strike code', marks: [] }],
  }
  const doc = prosemirrorDocFromNano(initial)

  const next = applyMark(applyMark(applyMark(
    doc,
    nanoMarkNames.underline,
    1,
    10,
  ), nanoMarkNames.strike, 11, 17), nanoMarkNames.code, 18, 22)

  assert.deepEqual(nanoDocumentFromProseMirror(next).blocks[0], {
    id: 'b1',
    type: 'paragraph',
    text: 'underline strike code',
    marks: [
      { type: 'underline', from: 0, to: 9 },
      { type: 'strike', from: 10, to: 16 },
      { type: 'code', from: 17, to: 21 },
    ],
  })
})

test('Nano2 T0 StarterKit: block commands lower to Nano block variants', () => {
  assert.deepEqual(setSingleBlock(nanoNodeNames.heading, { level: 3 }).blocks[0], {
    id: 'b1',
    type: 'heading',
    level: 3,
    text: 'Target',
    marks: [],
  })
  assert.deepEqual(setSingleBlock(nanoNodeNames.listItem, { kind: 'bullet', indent: 0, marker: '-' }).blocks[0], {
    id: 'b1',
    type: 'list_item',
    kind: 'bullet',
    indent: 0,
    text: 'Target',
    marks: [],
  })
  assert.deepEqual(setSingleBlock(nanoNodeNames.listItem, { kind: 'ordered', indent: 0, orderedMarker: '.', start: 1 }).blocks[0], {
    id: 'b1',
    type: 'list_item',
    kind: 'ordered',
    indent: 0,
    start: 1,
    text: 'Target',
    marks: [],
  })
  assert.deepEqual(setSingleBlock(nanoNodeNames.quote).blocks[0], {
    id: 'b1',
    type: 'quote',
    text: 'Target',
    marks: [],
  })
  assert.deepEqual(setSingleBlock(nanoNodeNames.codeBlock).blocks[0], {
    id: 'b1',
    type: 'code',
    text: 'Target',
  })
})

function applyMark(doc, markName, from, to) {
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, from, to),
  })
  let transaction = null
  assert.equal(toggleMark(nanoSchema.marks[markName])(state, (tr) => { transaction = tr }), true)
  assert(transaction)
  return transaction.doc
}

function setSingleBlock(nodeName, attrs = {}) {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Target', marks: [] }],
  }
  const doc = prosemirrorDocFromNano(initial)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1),
  })
  let transaction = null
  assert.equal(setBlockType(nanoSchema.nodes[nodeName], attrs)(state, (tr) => { transaction = tr }), true)
  assert(transaction)
  return nanoDocumentFromProseMirror(transaction.doc)
}

test('Nano2 T1 Markdown shortcuts: block prefixes lower to Nano block variants', () => {
  assert.deepEqual(typeTextWithNano2Shortcut('# ').blocks[0], {
    id: 'b1',
    type: 'heading',
    level: 1,
    text: '',
    marks: [],
  })
  assert.deepEqual(typeTextWithNano2Shortcut('- ').blocks[0], {
    id: 'b1',
    type: 'list_item',
    kind: 'bullet',
    indent: 0,
    text: '',
    marks: [],
  })
  assert.deepEqual(typeTextWithNano2Shortcut('03) ').blocks[0], {
    id: 'b1',
    type: 'list_item',
    kind: 'ordered',
    indent: 0,
    start: 3,
    orderedMarker: ')',
    orderedStartText: '03',
    text: '',
    marks: [],
  })
  assert.deepEqual(typeTextWithNano2Shortcut('> ').blocks[0], {
    id: 'b1',
    type: 'quote',
    text: '',
    marks: [],
  })
  assert.deepEqual(typeTextWithNano2Shortcut('```ts ').blocks[0], {
    id: 'b1',
    type: 'code',
    text: '',
    language: 'ts',
  })
  assert.deepEqual(typeTextWithNano2Shortcut('--- ').blocks[0], {
    id: 'b1',
    type: 'divider',
  })
})

test('Nano2 T1 Tasks: task shortcuts lower to Nano todo blocks', () => {
  assert.deepEqual(typeTextWithNano2Shortcut('[ ] ').blocks[0], {
    id: 'b1',
    type: 'todo',
    checked: false,
    indent: 0,
    text: '',
    marks: [],
  })
  assert.deepEqual(typeTextWithNano2Shortcut('[x] ').blocks[0], {
    id: 'b1',
    type: 'todo',
    checked: true,
    indent: 0,
    text: '',
    marks: [],
  })
  assert.deepEqual(typeTextWithNano2Shortcut('* [X] ').blocks[0], {
    id: 'b1',
    type: 'todo',
    checked: true,
    checkedMarker: 'X',
    indent: 0,
    marker: '*',
    text: '',
    marks: [],
  })
})

test('Nano2 T1 Tasks: checkbox toggle commits canonical NanoDocument change', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'todo', checked: false, indent: 0, text: 'Task', marks: [] }],
  }
  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1),
  })
  const transaction = nano2ToggleTodoTransaction(state, 0)

  assert(transaction)

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-task-toggle',
    origin: 'nano2-tiptap-tasks',
  })
  assert(change)
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value.blocks[0], {
    id: 'b1',
    type: 'todo',
    checked: true,
    indent: 0,
    text: 'Task',
    marks: [],
  })
  assert.equal(Boolean(engine.history.undo()), true)
  assert.deepEqual(engine.value, initial)
})

test('Nano2 T1 Images: setImage lowers to Nano image block and Markdown export', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: '', marks: [] }],
  }
  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1),
  })
  const transaction = nano2SetImageTransaction(state, {
    src: 'https://cdn.example.com/cover.png',
    alt: 'Cover image',
    title: 'Cover title',
  })

  assert(transaction)

  const next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next.blocks[0], {
    id: 'b1',
    type: 'image',
    src: 'https://cdn.example.com/cover.png',
    alt: 'Cover image',
    title: 'Cover title',
  })
  assert.equal(nanoMarkdownFromDocument(next), '![Cover image](https://cdn.example.com/cover.png "Cover title")')

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-set-image',
    origin: 'nano2-tiptap-images',
  })
  assert(change)
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
  assert.equal(Boolean(engine.history.undo()), true)
  assert.deepEqual(engine.value, initial)
})

test('Nano2 T1 Markdown shortcuts: delimiters lower to Nano mark ranges', () => {
  const next = typeTextWithNano2Shortcut('**bold** *em* ~~gone~~ `code`')

  assert.deepEqual(next.blocks[0], {
    id: 'b1',
    type: 'paragraph',
    text: 'bold em gone code',
    marks: [
      { type: 'bold', from: 0, to: 4 },
      { type: 'italic', from: 5, to: 7 },
      { type: 'strike', from: 8, to: 12 },
      { type: 'code', from: 13, to: 17 },
    ],
  })
})

function typeTextWithNano2Shortcut(text) {
  const doc = prosemirrorDocFromNano({
    blocks: [{ id: 'b1', type: 'paragraph', text: '', marks: [] }],
  })
  let state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1),
  })

  for (const character of text) {
    const { from, to } = state.selection
    const transaction = nano2MarkdownShortcutTransaction(state, from, to, character)
      ?? state.tr.insertText(character, from, to)
    state = state.apply(transaction)
  }

  return nanoDocumentFromProseMirror(state.doc)
}
