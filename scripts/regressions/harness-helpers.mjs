import assert from 'node:assert/strict'
import { AllSelection, EditorState, NodeSelection, TextSelection } from 'prosemirror-state'
import { markShortcutTransaction } from '../../src/marks/nano-mark-options.ts'
import { nanoDocumentFromMarkdown, nanoMarkdownFromDocument } from '../../src/codecs/markdown/nano-markdown.ts'
import {
  nanoBlocksFromProseMirror,
  nanoMarkNames,
  nanoSchema,
  prosemirrorDocFromNano,
} from '../../src/adapters/prosemirror/prosemirror-nano.ts'

export function textState(text) {
  const doc = prosemirrorDocFromNano({
    blocks: [{ id: 'b1', type: 'paragraph', text, marks: [] }],
  })
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1 + text.length),
  })
}

export function selectedState(markdown, blockId) {
  const doc = prosemirrorDocFromNano(nanoDocumentFromMarkdown(markdown))
  const position = blockPositionById(doc, blockId)
  assert.notEqual(position, null)
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: NodeSelection.create(doc, position),
  })
}

export function allSelectedState(markdown) {
  const doc = prosemirrorDocFromNano(nanoDocumentFromMarkdown(markdown))
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: new AllSelection(doc),
  })
}

export function textSelectionState(markdown, blockId, offset) {
  const doc = prosemirrorDocFromNano(nanoDocumentFromMarkdown(markdown))
  const position = blockPositionById(doc, blockId)
  assert.notEqual(position, null)
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, position + 1 + offset),
  })
}

export function blockAfterMarkShortcut(text, input) {
  const state = textState(text)
  const transaction = markShortcutTransaction(state, state.selection.from, state.selection.from, input)
  return blocksAfter(state, transaction)[0]
}

export function blockDomSpec(block) {
  const node = prosemirrorDocFromNano({ blocks: [block] }).firstChild
  assert(node)
  assert.equal(typeof node.type.spec.toDOM, 'function')
  return node.type.spec.toDOM(node)
}

export function markDomSpec(mark) {
  const markName = nanoMarkNames[mark.type] ?? (nanoSchema.marks[mark.type] ? mark.type : null)
  assert(markName)
  const proseMirrorMark = nanoSchema.marks[markName].create(mark)
  assert.equal(typeof proseMirrorMark.type.spec.toDOM, 'function')
  return proseMirrorMark.type.spec.toDOM(proseMirrorMark)
}

export function domSpecHasClass(spec, className) {
  if (!Array.isArray(spec)) return false
  const attrs = spec[1] && typeof spec[1] === 'object' && !Array.isArray(spec[1]) ? spec[1] : null
  if (typeof attrs?.class === 'string' && attrs.class.split(/\s+/).includes(className)) return true
  return spec.some((child) => domSpecHasClass(child, className))
}

export function blocksAfter(state, transaction) {
  assert(transaction)
  return nanoBlocksFromProseMirror(state.apply(transaction).doc)
}

export function markdownAfter(state, transaction) {
  assert(transaction)
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(transaction.doc) })
}

export function selectedBlockText(state, transaction) {
  assert(transaction)
  const nextState = state.apply(transaction)
  const node = nextState.doc.nodeAt(nextState.selection.from)
  assert(node)
  return node.textContent
}

export function blockPositionById(doc, id) {
  let position = null
  doc.forEach((node, offset) => {
    if (node.attrs.id === id) position = offset
  })
  return position
}
