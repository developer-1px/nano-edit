import {
  setBlockType,
  toggleMark,
} from 'prosemirror-commands'
import { NodeSelection, TextSelection } from 'prosemirror-state'
import {
  nanoDocumentChangeFromProseMirrorDoc,
  nanoDocumentFromProseMirror,
  prosemirrorDocFromNano,
} from '../../src/adapters/prosemirror/prosemirror-document.ts'
import { createNanoDocumentInMemoryCollaborationHub } from '../../src/adapters/collaboration/nano-document-in-memory-collaboration.ts'
import {
  nanoMarkNames,
  nanoNodeNames,
} from '../../src/adapters/prosemirror/prosemirror-names.ts'
import { mentionNodeSpec } from '../../src/adapters/prosemirror/prosemirror-reference-node-specs.ts'
import { nanoSchema } from '../../src/adapters/prosemirror/prosemirror-schema.ts'
import {
  commitNanoDocumentChange,
  nanoDocumentChangeFromDocuments,
} from '../../src/entities/document/nano-document-change.ts'
import { createNanoDocument } from '../../src/entities/document/nano-document.ts'
import { NanoDocumentSchema } from '../../src/entities/document/nano-document-model.ts'
import {
  blockTextPointer,
  point,
  selectionSnap,
} from '../../src/entities/document/nano-document-selection.ts'
import { blockPositionById } from '../../src/entities/block/structure/nano-block-node-kind.ts'
import { nanoMarkdownFromDocument } from '../../src/codecs/markdown/nano-markdown.ts'
import { nano2CleverReplacementTransaction } from '../../src/nano2/clever-replacements.ts'
import {
  nano2DrawingBlockType,
  nano2DrawingBlockWithStroke,
} from '../../src/nano2/drawing.ts'
import {
  nano2LongTextsTargetBlockId,
  nano2LongTextsWordCount,
  nano2TiptapCleverEditorDocument,
  nano2TiptapCollaborationDocument,
  nano2TiptapDefaultEditorDocument,
  nano2TiptapDrawingDocument,
  nano2TiptapForcedContentStructureDocument,
  nano2TiptapLongTextsDocument,
  nano2TiptapSyntaxHighlightingDocument,
} from '../../src/nano2/examples/documents.ts'
import {
  isNano2ForcedStructureDocument,
  parseNano2ForcedStructureDocument,
} from '../../src/nano2/forced-structure.ts'
import { nano2SetImageTransaction } from '../../src/nano2/images.ts'
import { nano2MarkdownShortcutTransaction } from '../../src/nano2/markdown-shortcuts.ts'
import {
  nano2MenuActionTransaction,
  nano2MenuCommandState,
} from '../../src/nano2/menus.ts'
import { nano2InsertMentionTransaction } from '../../src/nano2/mentions.ts'
import { nano2SetTextDirectionTransaction } from '../../src/nano2/text-direction.ts'
import {
  nano2SlashCommandContextFromState,
  nano2SlashCommandTransaction,
} from '../../src/nano2/slash-commands.ts'
import { nano2SyntaxHighlightTokens } from '../../src/nano2/syntax-highlighting.ts'
import {
  isNano2MinimalDocument,
  parseNano2MinimalDocument,
} from '../../src/nano2/minimal.ts'
import { nano2SetTableCellTransaction } from '../../src/nano2/tables.ts'
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

test('Nano2 T2 Mentions: suggestion insertion lowers to a one-character Nano mark', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Hi @mi', marks: [] }],
  }
  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 7),
  })
  const transaction = nano2InsertMentionTransaction(state, {
    id: 'mina',
    label: 'Mina',
  }, {
    from: 4,
    to: 7,
  })

  assert(transaction)
  const next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next.blocks[0], {
    id: 'b1',
    type: 'paragraph',
    text: 'Hi \ufffc ',
    marks: [{ type: 'mention', from: 3, to: 4, id: 'mina', label: 'Mina' }],
  })
  assert.equal(next.blocks[0].marks[0].to - next.blocks[0].marks[0].from, 1)
  assert.equal(prosemirrorDocFromNano(next).firstChild.child(1).type.name, nanoNodeNames.mention)

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-insert-mention',
    origin: 'nano2-tiptap-mentions',
  })
  assert(change)
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
  assert.equal(Boolean(engine.history.undo()), true)
  assert.deepEqual(engine.value, initial)
})

test('Nano2 T2 Menus: menu state and actions lower to NanoDocument changes', () => {
  const initial = {
    blocks: [
      { id: 'selection', type: 'paragraph', text: 'Select target', marks: [] },
      { id: 'floating', type: 'paragraph', text: '', marks: [] },
    ],
  }
  const engine = createNanoDocument(initial)
  let doc = prosemirrorDocFromNano(engine.value)
  let state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1, 7),
  })

  assert.deepEqual(nano2MenuCommandState(state), {
    boldActive: false,
    bubbleVisible: true,
    bulletListActive: false,
    floatingVisible: false,
    italicActive: false,
  })

  let transaction = nano2MenuActionTransaction(state, 'bold')
  assert(transaction)
  let next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next.blocks[0], {
    id: 'selection',
    type: 'paragraph',
    text: 'Select target',
    marks: [{ type: 'bold', from: 0, to: 6 }],
  })

  const floatingPosition = blockPositionById(transaction.doc, 'floating')
  assert.notEqual(floatingPosition, null)
  doc = transaction.doc
  state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, floatingPosition + 1),
  })
  assert.deepEqual(nano2MenuCommandState(state), {
    boldActive: false,
    bubbleVisible: false,
    bulletListActive: false,
    floatingVisible: true,
    italicActive: false,
  })

  transaction = nano2MenuActionTransaction(state, 'heading1')
  assert(transaction)
  next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next.blocks[1], {
    id: 'floating',
    type: 'heading',
    level: 1,
    text: '',
    marks: [],
  })

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-menu-heading',
    origin: 'nano2-tiptap-menus',
  })
  assert(change)
  assert(change.operations.some((operation) => operation.path.startsWith('/blocks')))
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

function applyCommandAtBlock(doc, blockId, command, options = {}) {
  const position = blockPositionById(doc, blockId)
  assert.notEqual(position, null)

  const node = doc.nodeAt(position)
  assert(node)
  const fromOffset = options.fromOffset ?? node.content.size
  const toOffset = options.toOffset ?? fromOffset
  const from = position + 1 + fromOffset
  const to = position + 1 + toOffset
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, from, to),
  })
  let transaction = null
  assert.equal(command(state, (tr) => { transaction = tr }), true)
  assert(transaction)
  return transaction.doc
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

test('Nano2 T2 Long texts: large document edits stay narrow', () => {
  const initial = nano2TiptapLongTextsDocument
  assert(nano2LongTextsWordCount >= 200_000)
  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)

  const actualWordCount = initial.blocks
    .filter((block) => block.type === 'paragraph')
    .reduce((count, block) => count + block.text.split(/\s+/).filter(Boolean).length, 0)
  assert.equal(actualWordCount, nano2LongTextsWordCount)

  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const targetPosition = blockPositionById(doc, nano2LongTextsTargetBlockId)
  assert.notEqual(targetPosition, null)
  const targetNode = doc.nodeAt(targetPosition)
  assert(targetNode)

  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, targetPosition + 1 + targetNode.content.size),
  })
  const transaction = state.tr.insertText(' PATCHED-LONG')
  const next = nanoDocumentFromProseMirror(transaction.doc)
  const targetIndex = next.blocks.findIndex((block) => block.id === nano2LongTextsTargetBlockId)
  assert(targetIndex > 0)
  assert.equal(next.blocks[targetIndex].type, 'paragraph')
  assert(next.blocks[targetIndex].text.endsWith(' PATCHED-LONG'))

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-long-text-edit',
    origin: 'nano2-tiptap-long-texts',
  })
  assert(change)
  assert.deepEqual(change.operations, [{
    op: 'replace',
    path: `/blocks/${targetIndex}/text`,
    value: next.blocks[targetIndex].text,
  }])
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.equal(engine.value.blocks[targetIndex].text, next.blocks[targetIndex].text)
})

test('Nano2 T1 Default editor: common commands lower to NanoDocument state', () => {
  const initial = nano2TiptapDefaultEditorDocument
  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)

  const engine = createNanoDocument(initial)
  const markedDoc = applyCommandAtBlock(
    prosemirrorDocFromNano(engine.value),
    'nano2-default-inline-target',
    (state, dispatch) => toggleMark(nanoSchema.marks[nanoMarkNames.bold])(state, dispatch),
    { fromOffset: 0, toOffset: 6 },
  )
  const headingDoc = applyCommandAtBlock(
    markedDoc,
    'nano2-default-heading-target',
    (state, dispatch) => setBlockType(nanoSchema.nodes[nanoNodeNames.heading], {
      id: 'nano2-default-heading-target',
      level: 2,
    })(state, dispatch),
  )
  const listDoc = applyCommandAtBlock(
    headingDoc,
    'nano2-default-list-target',
    (state, dispatch) => setBlockType(nanoSchema.nodes[nanoNodeNames.listItem], {
      id: 'nano2-default-list-target',
      kind: 'bullet',
      indent: 0,
      marker: '-',
    })(state, dispatch),
  )

  const next = nanoDocumentFromProseMirror(listDoc)
  assert(next.blocks.some((block) =>
    block.id === 'nano2-default-inline-target'
    && block.type === 'paragraph'
    && block.marks.some((mark) => mark.type === 'bold' && block.text.slice(mark.from, mark.to) === 'Inline'),
  ))
  assert(next.blocks.some((block) =>
    block.id === 'nano2-default-heading-target'
    && block.type === 'heading'
    && block.level === 2,
  ))
  assert(next.blocks.some((block) =>
    block.id === 'nano2-default-list-target'
    && block.type === 'list_item'
    && block.kind === 'bullet',
  ))

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, listDoc, {
    label: 'nano2-default-editor-commands',
    origin: 'nano2-tiptap-default-editor',
  })
  assert(change)
  assert(change.operations.some((operation) => operation.path.startsWith('/blocks')))
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
})

test('Nano2 T1 Text direction: direction attrs lower to NanoDocument state', () => {
  const initial = {
    blocks: [
      { id: 'rtl', type: 'paragraph', text: 'مرحبا', marks: [], textDirection: 'rtl' },
      { id: 'target', type: 'paragraph', text: 'Target', marks: [] },
      { id: 'list', type: 'list_item', kind: 'bullet', indent: 0, text: 'שלום', marks: [] },
    ],
  }

  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)
  assert.throws(() => NanoDocumentSchema.parse({
    blocks: [{ id: 'bad', type: 'paragraph', text: 'Bad', marks: [], textDirection: 'sideways' }],
  }))

  const engine = createNanoDocument(initial)
  let doc = prosemirrorDocFromNano(engine.value)
  assert.equal(doc.child(0).attrs.textDirection, 'rtl')

  let targetPosition = blockPositionById(doc, 'target')
  assert.notEqual(targetPosition, null)
  let state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, targetPosition + 1),
  })
  let transaction = nano2SetTextDirectionTransaction(state, 'ltr')
  assert(transaction)
  let next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next.blocks[1], {
    id: 'target',
    type: 'paragraph',
    text: 'Target',
    marks: [],
    textDirection: 'ltr',
  })

  doc = transaction.doc
  targetPosition = blockPositionById(doc, 'target')
  const listPosition = blockPositionById(doc, 'list')
  assert.notEqual(targetPosition, null)
  assert.notEqual(listPosition, null)
  state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, targetPosition + 1, listPosition + 1),
  })
  transaction = nano2SetTextDirectionTransaction(state, 'auto')
  assert(transaction)
  next = nanoDocumentFromProseMirror(transaction.doc)

  assert.equal(next.blocks[1].textDirection, 'auto')
  assert.equal(next.blocks[2].textDirection, 'auto')
  assert.equal(prosemirrorDocFromNano(next).child(1).attrs.textDirection, 'auto')

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-text-direction-auto',
    origin: 'nano2-tiptap-text-direction',
  })
  assert(change)
  assert(change.operations.some((operation) => operation.path.startsWith('/blocks')))
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
  assert.equal(Boolean(engine.history.undo()), true)
  assert.deepEqual(engine.value, initial)
})

test('Nano2 T1 Minimal setup: zod profile accepts only paragraph text blocks', () => {
  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Plain', marks: [] }],
  }

  assert.deepEqual(parseNano2MinimalDocument(initial), initial)
  assert.equal(isNano2MinimalDocument({
    blocks: [{ id: 'b1', type: 'heading', level: 1, text: 'Title', marks: [] }],
  }), false)
  assert.equal(isNano2MinimalDocument({
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Bold', marks: [{ type: 'bold', from: 0, to: 4 }] }],
  }), false)
  assert.equal(isNano2MinimalDocument({
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'One', marks: [] },
      { id: 'b1', type: 'paragraph', text: 'Two', marks: [] },
    ],
  }), false)

  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 6),
  })
  const transaction = state.tr.insertText(' text', 6, 6)
  const next = nanoDocumentFromProseMirror(transaction.doc)

  assert.deepEqual(parseNano2MinimalDocument(next), {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Plain text', marks: [] }],
  })

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-minimal-text-input',
    origin: 'nano2-tiptap-minimal-setup',
  })
  assert(change)
  assert.deepEqual(change.operations, [{ op: 'replace', path: '/blocks/0/text', value: 'Plain text' }])
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(parseNano2MinimalDocument(engine.value), next)
})

test('Nano2 T1 Tables: setTableCell lowers to Nano table row changes', () => {
  const initial = {
    blocks: [{
      id: 'table',
      type: 'table',
      rows: [
        ['Name', 'Status'],
        ['Alpha', 'Open'],
        ['Beta', 'Queued'],
      ],
      align: ['left', 'center'],
    }],
  }
  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: NodeSelection.create(doc, 0),
  })
  const transaction = nano2SetTableCellTransaction(state, 'table', 1, 1, 'Closed')

  assert(transaction)

  const next = nanoDocumentFromProseMirror(transaction.doc)
  assert.deepEqual(next.blocks[0], {
    id: 'table',
    type: 'table',
    rows: [
      ['Name', 'Status'],
      ['Alpha', 'Closed'],
      ['Beta', 'Queued'],
    ],
    align: ['left', 'center'],
  })
  assert.equal(nanoMarkdownFromDocument(next), [
    '| Name | Status |',
    '| :--- | :---: |',
    '| Alpha | Closed |',
    '| Beta | Queued |',
  ].join('\n'))

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-table-cell-input',
    origin: 'nano2-tiptap-tables',
  })
  assert(change)
  assert.deepEqual(change.operations, [{ op: 'replace', path: '/blocks/0/rows/1/1', value: 'Closed' }])
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

test('Nano2 T2 Clever editor: custom replacements lower to NanoDocument changes', () => {
  const initial = nano2TiptapCleverEditorDocument
  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)

  const engine = createNanoDocument(initial)

  const emojiOperations = typeTextWithNano2CleverReplacement(engine, 'nano2-clever-emoji', ':)')
  assert(emojiOperations.some((operation) =>
    operation.inputType === 'nano2CleverReplacement:emoji-smile'
    && JSON.stringify(operation.operations) === JSON.stringify([{ op: 'replace', path: '/blocks/1/text', value: '🙂' }]),
  ))
  assert.deepEqual(engine.value.blocks.find((block) => block.id === 'nano2-clever-emoji'), {
    id: 'nano2-clever-emoji',
    type: 'paragraph',
    text: '🙂',
    marks: [],
  })

  const typographyOperations = typeTextWithNano2CleverReplacement(engine, 'nano2-clever-typography', '-> (c)')
  assert(typographyOperations.some((operation) =>
    operation.inputType === 'nano2CleverReplacement:arrow-right'
    && JSON.stringify(operation.operations) === JSON.stringify([{ op: 'replace', path: '/blocks/2/text', value: '→' }]),
  ))
  assert(typographyOperations.some((operation) =>
    operation.inputType === 'nano2CleverReplacement:copyright'
    && JSON.stringify(operation.operations) === JSON.stringify([{ op: 'replace', path: '/blocks/2/text', value: '→ ©' }]),
  ))
  assert.deepEqual(engine.value.blocks.find((block) => block.id === 'nano2-clever-typography'), {
    id: 'nano2-clever-typography',
    type: 'paragraph',
    text: '→ ©',
    marks: [],
  })

  const highlightOperations = typeTextWithNano2CleverReplacement(engine, 'nano2-clever-highlight', '==bright==')
  const highlightOperation = highlightOperations.find((operation) => operation.inputType === 'nano2CleverReplacement:highlight')
  assert(highlightOperation)
  assert(highlightOperation.operations.some((operation) =>
    operation.path === '/blocks/3'
    && operation.value?.id === 'nano2-clever-highlight'
    && operation.value?.text === 'bright'
    && operation.value?.marks?.some((mark) => mark.type === 'highlight' && mark.from === 0 && mark.to === 6),
  ))
  assert.deepEqual(engine.value.blocks.find((block) => block.id === 'nano2-clever-highlight'), {
    id: 'nano2-clever-highlight',
    type: 'paragraph',
    text: 'bright',
    marks: [{ type: 'highlight', from: 0, to: 6 }],
  })
  assert.equal(prosemirrorDocFromNano(engine.value).child(3).child(0).marks[0]?.type.name, nanoMarkNames.highlight)
})

test('Nano2 T2 Forced content structure: Zod profile guards document shape', () => {
  const initial = nano2TiptapForcedContentStructureDocument
  assert.deepEqual(parseNano2ForcedStructureDocument(initial), initial)
  assert.equal(isNano2ForcedStructureDocument(initial), true)
  assert.equal(isNano2ForcedStructureDocument({
    blocks: [{ id: 'bad', type: 'paragraph', text: 'No title', marks: [] }],
  }), false)
  assert.equal(isNano2ForcedStructureDocument({
    blocks: [{ id: 'title', type: 'heading', level: 1, text: 'Only title', marks: [] }],
  }), false)
  assert.equal(isNano2ForcedStructureDocument({
    blocks: [
      { id: 'title', type: 'heading', level: 1, text: 'Title', marks: [] },
      { id: 'nested-heading', type: 'heading', level: 2, text: 'Nested', marks: [] },
    ],
  }), false)

  const engine = createNanoDocument(initial)
  let doc = prosemirrorDocFromNano(engine.value)
  const titlePosition = blockPositionById(doc, 'nano2-forced-title')
  assert.notEqual(titlePosition, null)
  let state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, titlePosition + 1),
  })
  let transaction = null
  assert.equal(setBlockType(nanoSchema.nodes[nanoNodeNames.paragraph])(state, (tr) => { transaction = tr }), true)
  assert(transaction)
  const invalidTitleDocument = nanoDocumentFromProseMirror(transaction.doc)
  assert.equal(isNano2ForcedStructureDocument(invalidTitleDocument), false)

  doc = prosemirrorDocFromNano(engine.value)
  const bodyPosition = blockPositionById(doc, 'nano2-forced-body')
  assert.notEqual(bodyPosition, null)
  const body = doc.nodeAt(bodyPosition)
  assert(body)
  state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, bodyPosition + 1 + body.content.size),
  })
  transaction = state.tr.insertText(' edited')
  const next = nanoDocumentFromProseMirror(transaction.doc)
  assert.equal(isNano2ForcedStructureDocument(next), true)

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-forced-body-edit',
    origin: 'nano2-tiptap-forced-content-structure',
  })
  assert(change)
  assert.deepEqual(change.operations, [{ op: 'replace', path: '/blocks/2/text', value: 'Body target edited' }])
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(parseNano2ForcedStructureDocument(engine.value), next)
})

test('Nano2 T3 Slash commands: trigger query lowers to Nano block commands', () => {
  assert.deepEqual(typeSlashCommand('/heading', 'heading1').blocks[0], {
    id: 'b1',
    type: 'heading',
    level: 1,
    text: '',
    marks: [],
  })
  assert.deepEqual(typeSlashCommand('/bullet', 'bulletList').blocks[0], {
    id: 'b1',
    type: 'list_item',
    kind: 'bullet',
    indent: 0,
    text: '',
    marks: [],
  })
  assert.deepEqual(typeSlashCommand('/quote', 'quote').blocks[0], {
    id: 'b1',
    type: 'quote',
    text: '',
    marks: [],
  })
  assert.deepEqual(typeSlashCommand('/code', 'codeBlock').blocks[0], {
    id: 'b1',
    type: 'code',
    text: '',
  })

  const initial = {
    blocks: [{ id: 'b1', type: 'paragraph', text: '/bullet', marks: [] }],
  }
  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 8),
  })
  assert.deepEqual(nano2SlashCommandContextFromState(state), {
    from: 1,
    query: 'bullet',
    to: 8,
  })
  const transaction = nano2SlashCommandTransaction(state, 'bulletList')
  assert(transaction)
  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-slash-command-bullet',
    origin: 'nano2-tiptap-slash-commands',
  })
  assert(change)
  assert.deepEqual(change.operations, [{
    op: 'replace',
    path: '/blocks/0',
    value: {
      id: 'b1',
      type: 'list_item',
      kind: 'bullet',
      indent: 0,
      text: '',
      marks: [],
    },
  }])
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, nanoDocumentFromProseMirror(transaction.doc))
})

test('Nano2 T3 Syntax highlighting: lowlight tokens are view-only code projections', () => {
  const initial = nano2TiptapSyntaxHighlightingDocument
  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)

  const codeBlock = initial.blocks.find((block) => block.id === 'nano2-syntax-code')
  assert(codeBlock)
  assert.equal(codeBlock.type, 'code')

  const tokens = nano2SyntaxHighlightTokens(codeBlock.text, codeBlock.language ?? null)
  assert(tokens.some((token) => token.className.includes('hljs-keyword') && codeBlock.text.slice(token.from, token.to) === 'const'))
  assert(tokens.some((token) => token.className.includes('hljs-number') && codeBlock.text.slice(token.from, token.to) === '42'))
  assert(tokens.every((token) => token.from >= 0 && token.to <= codeBlock.text.length))

  const engine = createNanoDocument(initial)
  const doc = prosemirrorDocFromNano(engine.value)
  const codePosition = blockPositionById(doc, 'nano2-syntax-code')
  assert.notEqual(codePosition, null)
  const codeNode = doc.nodeAt(codePosition)
  assert(codeNode)

  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, codePosition + 1 + codeNode.content.size),
  })
  const transaction = state.tr.insertText('\nconst next = answer + 1')
  const next = nanoDocumentFromProseMirror(transaction.doc)
  const nextCodeBlock = next.blocks.find((block) => block.id === 'nano2-syntax-code')
  assert(nextCodeBlock)
  assert.equal(nextCodeBlock.type, 'code')
  assert.equal(nextCodeBlock.language, 'typescript')
  assert.equal('marks' in nextCodeBlock, false)
  assert(nextCodeBlock.text.endsWith('const next = answer + 1'))

  const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
    label: 'nano2-syntax-code-edit',
    origin: 'nano2-tiptap-syntax-highlighting',
  })
  assert(change)
  assert.deepEqual(change.operations, [{ op: 'replace', path: '/blocks/1/text', value: nextCodeBlock.text }])
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
})

test('Nano2 T3 Collaboration: NanoDocumentChange hub converges route peers', () => {
  const initial = nano2TiptapCollaborationDocument
  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)

  const peerAEngine = createNanoDocument(initial)
  const peerBEngine = createNanoDocument(initial)
  const hub = createNanoDocumentInMemoryCollaborationHub()
  const peerA = hub.connect({ engine: peerAEngine, peerId: 'peer-a' })
  const peerB = hub.connect({ engine: peerBEngine, peerId: 'peer-b' })
  const peerBSelection = selectionSnap(
    point(blockTextPointer(2), 4),
    point(blockTextPointer(2), 4),
  )
  peerBEngine.selection?.restore(peerBSelection)

  const afterPeerA = nano2DocumentWithBlockText(
    peerAEngine.value,
    'nano2-collab-shared',
    'Shared paragraph from peer A',
  )
  const peerAChange = nanoDocumentChangeFromDocuments(peerAEngine.value, afterPeerA, {
    label: 'nano2-collaboration-peer-a',
    origin: 'peer-a',
    selection: selectionSnap(
      point(blockTextPointer(1), 'Shared paragraph from peer A'.length),
      point(blockTextPointer(1), 'Shared paragraph from peer A'.length),
    ),
  })
  assert(peerAChange)
  assert.equal(commitNanoDocumentChange(peerAEngine, peerAChange).ok, true)
  const peerADispatch = peerA.publish(peerAChange, { revision: 1 })

  assert.deepEqual(peerADispatch.results.map((entry) => [entry.peerId, entry.result.ok]), [
    ['peer-a', true],
    ['peer-b', true],
  ])
  assert.deepEqual(peerBEngine.value, afterPeerA)
  assert.deepEqual(peerBEngine.selection?.snapshot().focus, peerBSelection.focus)

  const afterPeerB = nano2DocumentWithBlockText(
    peerBEngine.value,
    'nano2-collab-second',
    'Second peer paragraph from peer B',
  )
  const peerBChange = nanoDocumentChangeFromDocuments(peerBEngine.value, afterPeerB, {
    label: 'nano2-collaboration-peer-b',
    origin: 'peer-b',
  })
  assert(peerBChange)
  assert.equal(commitNanoDocumentChange(peerBEngine, peerBChange).ok, true)
  const peerBDispatch = peerB.publish(peerBChange, { revision: 2 })

  assert.deepEqual(peerBDispatch.results.map((entry) => [entry.peerId, entry.result.ok]), [
    ['peer-a', true],
    ['peer-b', true],
  ])
  assert.deepEqual(peerAEngine.value, afterPeerB)

  const peerCEngine = createNanoDocument(peerAEngine.value)
  const peerC = hub.connect({ engine: peerCEngine, peerId: 'peer-c' })
  assert.deepEqual(hub.peerIds(), ['peer-a', 'peer-b', 'peer-c'])
  assert.deepEqual(peerCEngine.value, peerAEngine.value)

  const afterLateJoin = nano2DocumentWithBlockText(
    peerAEngine.value,
    'nano2-collab-shared',
    'Shared paragraph from peer A after peer C joined',
  )
  const lateJoinChange = nanoDocumentChangeFromDocuments(peerAEngine.value, afterLateJoin, {
    label: 'nano2-collaboration-late-join',
    origin: 'peer-a',
  })
  assert(lateJoinChange)
  assert.equal(commitNanoDocumentChange(peerAEngine, lateJoinChange).ok, true)
  const lateJoinDispatch = peerA.publish(lateJoinChange, { revision: 3 })
  const duplicate = peerC.receive(JSON.parse(JSON.stringify(lateJoinDispatch.message)))

  assert.equal(duplicate.ok, true)
  assert.deepEqual(peerAEngine.value, afterLateJoin)
  assert.deepEqual(peerBEngine.value, afterLateJoin)
  assert.deepEqual(peerCEngine.value, afterLateJoin)
})

test('Nano2 T3 Drawing: custom block strokes stay NanoDocument JSON data', () => {
  const initial = nano2TiptapDrawingDocument
  assert.deepEqual(NanoDocumentSchema.parse(initial), initial)

  const drawingBlock = initial.blocks.find((block) => block.id === 'nano2-drawing-canvas')
  assert(drawingBlock)
  assert.equal(drawingBlock.type, nano2DrawingBlockType)
  assert.equal(drawingBlock.data.strokes.length, 1)

  const nextDrawingBlock = nano2DrawingBlockWithStroke(drawingBlock, {
    color: '#d95b56',
    points: [
      [40, 40],
      [120, 80],
      [220, 60],
    ],
    width: 5,
  })
  assert.equal(nextDrawingBlock.data.strokes.length, 2)
  assert.equal(nextDrawingBlock.text, '2 drawing strokes')

  const next = {
    ...initial,
    blocks: initial.blocks.map((block) => block.id === nextDrawingBlock.id ? nextDrawingBlock : block),
  }
  assert.deepEqual(NanoDocumentSchema.parse(next), next)

  const change = nanoDocumentChangeFromDocuments(initial, next, {
    label: 'nano2-drawing-stroke',
    origin: 'nano2-tiptap-drawing',
  })
  assert(change)
  assert.deepEqual(change.operations.map((operation) => operation.path), ['/blocks/1'])
  assert.equal('canvas' in nextDrawingBlock.data, false)

  const engine = createNanoDocument(initial)
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
})

function nano2DocumentWithBlockText(document, blockId, text) {
  return {
    ...document,
    blocks: document.blocks.map((block) => block.id === blockId
      ? { ...block, text }
      : block),
  }
}

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

function typeTextWithNano2CleverReplacement(engine, blockId, text) {
  const doc = prosemirrorDocFromNano(engine.value)
  const position = blockPositionById(doc, blockId)
  assert.notEqual(position, null)

  const block = doc.nodeAt(position)
  assert(block)
  let state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, position + 1 + block.content.size),
  })
  const operations = []

  for (const character of text) {
    const { from, to } = state.selection
    const transaction = nano2CleverReplacementTransaction(state, from, to, character)
      ?? state.tr.insertText(character, from, to)
    const inputType = transaction.getMeta('inputType')
    const change = nanoDocumentChangeFromProseMirrorDoc(engine.value, transaction.doc, {
      label: typeof inputType === 'string' ? inputType : 'nano2-clever-text',
      origin: 'nano2-tiptap-clever-editor',
    })
    assert(change)
    assert.equal(commitNanoDocumentChange(engine, change).ok, true)
    operations.push({ inputType, operations: change.operations })
    state = state.apply(transaction)
  }

  return operations
}

function typeSlashCommand(text, action) {
  const doc = prosemirrorDocFromNano({
    blocks: [{ id: 'b1', type: 'paragraph', text, marks: [] }],
  })
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, text.length + 1),
  })
  const transaction = nano2SlashCommandTransaction(state, action)
  assert(transaction)
  return nanoDocumentFromProseMirror(transaction.doc)
}
