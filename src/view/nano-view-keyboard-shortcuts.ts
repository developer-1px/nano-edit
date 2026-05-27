import { EditorState, NodeSelection, type Transaction } from 'prosemirror-state'
import {
  blockAcceptsInputHints,
  blockEnterShortcutOptions,
  blockShortcutOptions,
  type BlockOptionRegistry,
} from '../blocks/nano-block-options'
import { footnoteMarkerInputTransaction } from './nano-view-footnote-marker-input'
import {
  headingMarkerInputTransaction,
  headingMarkerSpaceInputTransaction,
  headingPrefixInputTransaction,
} from './nano-view-heading-marker-input'
import {
  listMarkerInputTransaction,
  todoCheckboxInputTransaction,
  todoMarkerInputTransaction,
} from './nano-view-list-marker-input'
import {
  calloutMarkerInputTransaction,
  quoteMarkerInputTransaction,
} from './nano-view-quote-callout-marker-input'
import { blockShortcutTransactionForTemplate } from './nano-view-block-shortcut-template'
import { continuationMarkerInputTransaction } from './nano-view-continuation-markers'
import { paragraphPrefixInputTransaction } from './nano-view-paragraph-prefix-input'

export function blockShortcutTransaction(
  state: EditorState,
  from: number,
  to: number,
  text: string,
  registry?: BlockOptionRegistry,
): Transaction | null {
  if (from !== to) return null

  const $from = state.doc.resolve(from)
  const block = $from.parent
  const acceptsInputHints = registry
    ? registry.blockAcceptsInputHints(block)
    : blockAcceptsInputHints(block)
  if (!block.isTextblock || !acceptsInputHints) return null

  const continuationMarkerTransaction = continuationMarkerInputTransaction(state, $from, text)
  if (continuationMarkerTransaction) return continuationMarkerTransaction

  const headingMarkerTransaction = headingMarkerInputTransaction(state, $from, text)
  if (headingMarkerTransaction) return headingMarkerTransaction

  const headingMarkerSpaceTransaction = headingMarkerSpaceInputTransaction(state, $from, text)
  if (headingMarkerSpaceTransaction) return headingMarkerSpaceTransaction

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
  for (const shortcut of (registry ? registry.blockShortcutOptions() : blockShortcutOptions())) {
    const match = shortcut.pattern.exec(source)
    if (match) return blockShortcutTransactionForTemplate(state, $from, shortcut.template(match), registry)
  }

  return null
}

export function blockEnterShortcutTransaction(
  state: EditorState,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const { selection } = state
  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  const acceptsInputHints = registry
    ? registry.blockAcceptsInputHints(block)
    : blockAcceptsInputHints(block)
  if (!block.isTextblock || !acceptsInputHints) return null
  if ($from.parentOffset !== block.textContent.length) return null

  const source = block.textBetween(0, $from.parentOffset)
  if (source.length !== $from.parentOffset) return null

  for (const shortcut of (registry ? registry.blockEnterShortcutOptions() : blockEnterShortcutOptions())) {
    const match = shortcut.pattern.exec(source)
    if (match) return blockShortcutTransactionForTemplate(state, $from, shortcut.template(match), registry)
  }

  return null
}

export function slashPickerBlockIdFromInput(
  state: EditorState,
  from: number,
  to: number,
  text: string,
  registry?: BlockOptionRegistry,
): string | null {
  if (text !== '/' || from !== to) return null

  const $from = state.doc.resolve(from)
  const block = $from.parent
  const acceptsInputHints = registry
    ? registry.blockAcceptsInputHints(block)
    : blockAcceptsInputHints(block)
  if (!block.isTextblock || !acceptsInputHints) return null
  if ($from.parentOffset !== 0 || block.textContent.length > 0) return null

  return typeof block.attrs.id === 'string' && block.attrs.id ? block.attrs.id : null
}

export function slashPickerBlockIdFromSelection(state: EditorState): string | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null

  const id = selection.node.attrs.id
  return typeof id === 'string' && id ? id : null
}
