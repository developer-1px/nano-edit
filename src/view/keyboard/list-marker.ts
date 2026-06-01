import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import { markdownOrderedMarkerText } from '../block-template/markdown'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'

export function todoMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== ' ' || block.type.name !== nanoNodeNames.listItem || block.attrs.kind !== 'bullet') return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset) return null

  const match = /^\[([ xX])\]$/.exec(textBefore)
  if (!match) return null

  const todoType = state.schema.nodes[nanoNodeNames.todo]
  if (!todoType) return null

  const blockPosition = $from.before()
  const checkedMarker = match[1] === 'X' ? 'X' : 'x'
  const todo = todoType.create({
    id: block.attrs.id,
    checked: match[1]?.toLowerCase() === 'x',
    checkedMarker,
    continuationIndents: block.attrs.continuationIndents,
    indent: block.attrs.indent,
    indentText: block.attrs.indentText,
    marker: block.attrs.marker,
  }, block.content.cut($from.parentOffset))
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, todo)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

export function listMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if ($from.parentOffset !== 0) return null

  if (block.type.name === nanoNodeNames.listItem && block.attrs.kind === 'bullet' && isBulletMarkerInput(text)) {
    return setBlockAttrsAtStart(state, $from, {
      ...block.attrs,
      marker: text,
    })
  }

  if (block.type.name === nanoNodeNames.todo && isBulletMarkerInput(text)) {
    return setBlockAttrsAtStart(state, $from, {
      ...block.attrs,
      marker: text,
    })
  }

  if (block.type.name === nanoNodeNames.listItem && block.attrs.kind === 'ordered' && isOrderedMarkerInput(text)) {
    return setBlockAttrsAtStart(state, $from, {
      ...block.attrs,
      orderedMarker: text,
    })
  }

  if (block.type.name === nanoNodeNames.listItem && block.attrs.kind === 'ordered' && isOrderedStartInput(text)) {
    const orderedStartText = orderedStartTextFromInput(block.attrs, text)
    return setBlockAttrsAtStart(state, $from, {
      ...block.attrs,
      start: Math.max(1, Number(orderedStartText)),
      orderedStartText: orderedStartText === String(Math.max(1, Number(orderedStartText))) ? null : orderedStartText,
    })
  }

  return null
}

export function todoCheckboxInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if ($from.parentOffset !== 0 || block.type.name !== nanoNodeNames.todo) return null

  if (text === 'x' || text === 'X') {
    return setBlockAttrsAtStart(state, $from, {
      ...block.attrs,
      checked: true,
      checkedMarker: text,
    })
  }

  if (text === ' ') {
    return setBlockAttrsAtStart(state, $from, {
      ...block.attrs,
      checked: false,
    })
  }

  return null
}

function isBulletMarkerInput(text: string): text is '-' | '*' | '+' {
  return text === '-' || text === '*' || text === '+'
}

function isOrderedMarkerInput(text: string): text is '.' | ')' {
  return text === '.' || text === ')'
}

function isOrderedStartInput(text: string): boolean {
  return /^\d+$/.test(text)
}

function orderedStartTextFromInput(attrs: Record<string, unknown>, text: string): string {
  const currentText = markdownOrderedMarkerText(attrs.start, attrs.orderedStartText)
  return text.length === 1 && currentText.length > 1
    ? text.padStart(currentText.length, '0')
    : text
}

function setBlockAttrsAtStart(
  state: EditorState,
  $from: ResolvedPos,
  attrs: Record<string, unknown>,
): Transaction {
  const transaction = state.tr.setNodeMarkup($from.before(), $from.parent.type, attrs)
  transaction.setSelection(TextSelection.create(transaction.doc, $from.before() + 1))
  return transaction
}
