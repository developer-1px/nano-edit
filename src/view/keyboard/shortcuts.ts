import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import {
  blockAcceptsInputHints,
  blockEnterShortcutOptions,
  blockShortcutOptions,
  type BlockOptionRegistry,
} from '../../blocks/nano-block-options'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import { footnoteName } from '../../entities/reference/nano-footnote'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import {
  headingMarkerInputTransaction,
  headingMarkerSpaceInputTransaction,
  headingPrefixInputTransaction,
} from './heading-marker'
import {
  listMarkerInputTransaction,
  todoCheckboxInputTransaction,
  todoMarkerInputTransaction,
} from './list-marker'
import {
  calloutMarkerInputTransaction,
  quoteMarkerInputTransaction,
} from './quote-callout-marker'
import { blockShortcutTransactionForTemplate } from '../block-template/shortcut'
import { continuationMarkerInputTransaction } from './continuation-marker'
import { paragraphPrefixInputTransaction } from './paragraph-prefix'

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

  const paragraphPrefixTransaction = paragraphPrefixInputTransaction(state, $from, text, registry)
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

  return blockId(block) || null
}

export function slashPickerBlockIdFromSelection(
  state: EditorState,
  registry?: BlockOptionRegistry,
): string | null {
  const { selection } = state
  if (selection instanceof NodeSelection && selection.node.isBlock) {
    return blockId(selection.node) || null
  }

  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  const acceptsInputHints = registry
    ? registry.blockAcceptsInputHints(block)
    : blockAcceptsInputHints(block)
  if (!block.isTextblock || !acceptsInputHints) return null
  if ($from.parentOffset !== 0 || block.textContent.length > 0) return null

  return blockId(block) || null
}

function footnoteMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (block.type.name !== nanoNodeNames.footnote || (text !== ':' && text !== ' ')) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset) return null

  const match = /^\[\^([^\]\s\r\n]+)\]:( ?)$/.exec(textBefore + text)
  if (!match) return null

  const name = footnoteName(match[1] ?? '')
  if (!name) return null

  const footnote = block.type.create({
    ...block.attrs,
    name,
    footnoteTextSpacing: match[2] === ' ' ? null : 'none',
  }, block.content.cut($from.parentOffset))
  const blockPosition = $from.before()
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, footnote)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}
