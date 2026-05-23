import { EditorState, NodeSelection, type Transaction } from 'prosemirror-state'
import {
  blockAcceptsInputHints,
  blockEnterShortcutOptions,
  blockShortcutOptions,
} from './nano-block-options'
import {
  calloutMarkerInputTransaction,
  footnoteMarkerInputTransaction,
  headingMarkerInputTransaction,
  headingPrefixInputTransaction,
  listMarkerInputTransaction,
  quoteMarkerInputTransaction,
  todoCheckboxInputTransaction,
  todoMarkerInputTransaction,
} from './nano-view-block-marker-input'
import { blockShortcutTransactionForTemplate } from './nano-view-block-shortcut-template'
import { continuationMarkerInputTransaction } from './nano-view-continuation-markers'
import { paragraphPrefixInputTransaction } from './nano-view-paragraph-prefix-input'

export function blockShortcutTransaction(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): Transaction | null {
  if (from !== to) return null

  const $from = state.doc.resolve(from)
  const block = $from.parent
  if (!block.isTextblock || !blockAcceptsInputHints(block)) return null

  const continuationMarkerTransaction = continuationMarkerInputTransaction(state, $from, text)
  if (continuationMarkerTransaction) return continuationMarkerTransaction

  const headingMarkerTransaction = headingMarkerInputTransaction(state, $from, text)
  if (headingMarkerTransaction) return headingMarkerTransaction

  const headingPrefixTransaction = headingPrefixInputTransaction(state, $from, text)
  if (headingPrefixTransaction) return headingPrefixTransaction

  const paragraphPrefixTransaction = paragraphPrefixInputTransaction(state, $from, text)
  if (paragraphPrefixTransaction) return paragraphPrefixTransaction

  const todoMarkerTransaction = todoMarkerInputTransaction(state, $from, text)
  if (todoMarkerTransaction) return todoMarkerTransaction

  const footnoteMarkerTransaction = footnoteMarkerInputTransaction(state, $from, text)
  if (footnoteMarkerTransaction) return footnoteMarkerTransaction

  const listMarkerTransaction = listMarkerInputTransaction(state, $from, text)
  if (listMarkerTransaction) return listMarkerTransaction

  const todoCheckboxTransaction = todoCheckboxInputTransaction(state, $from, text)
  if (todoCheckboxTransaction) return todoCheckboxTransaction

  const quoteMarkerTransaction = quoteMarkerInputTransaction(state, $from, text)
  if (quoteMarkerTransaction) return quoteMarkerTransaction

  const calloutMarkerTransaction = calloutMarkerInputTransaction(state, $from, text)
  if (calloutMarkerTransaction) return calloutMarkerTransaction

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset || block.textContent.length !== textBefore.length) return null

  const source = textBefore + text
  for (const shortcut of blockShortcutOptions()) {
    const match = shortcut.pattern.exec(source)
    if (match) return blockShortcutTransactionForTemplate(state, $from, shortcut.template(match))
  }

  return null
}

export function blockEnterShortcutTransaction(state: EditorState): Transaction | null {
  const { selection } = state
  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  if (!block.isTextblock || !blockAcceptsInputHints(block)) return null
  if ($from.parentOffset !== block.textContent.length) return null

  const source = block.textBetween(0, $from.parentOffset)
  if (source.length !== $from.parentOffset) return null

  for (const shortcut of blockEnterShortcutOptions()) {
    const match = shortcut.pattern.exec(source)
    if (match) return blockShortcutTransactionForTemplate(state, $from, shortcut.template(match))
  }

  return null
}

export function slashPickerBlockIdFromInput(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): string | null {
  if (text !== '/' || from !== to) return null

  const $from = state.doc.resolve(from)
  const block = $from.parent
  if (!block.isTextblock || !blockAcceptsInputHints(block)) return null
  if ($from.parentOffset !== 0 || block.textContent.length > 0) return null

  return typeof block.attrs.id === 'string' && block.attrs.id ? block.attrs.id : null
}

export function slashPickerBlockIdFromSelection(state: EditorState): string | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null

  const id = selection.node.attrs.id
  return typeof id === 'string' && id ? id : null
}
