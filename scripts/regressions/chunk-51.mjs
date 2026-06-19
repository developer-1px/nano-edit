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
