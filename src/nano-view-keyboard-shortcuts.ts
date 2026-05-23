import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import {
  blockAcceptsInputHints,
  blockEnterShortcutOptions,
  blockShortcutOptions,
  generatedBlockId,
  type BlockTemplate,
} from './nano-block-options'
import { selectionAfterInsertedContent } from './nano-selection'
import {
  quoteMarkerDepthsOrNull,
  quoteMarkerSpacingOrNull,
} from './nano-source-metadata'
import {
  insertedContentForShortcutTemplate,
  selectionAfterMarkdownLineEnter,
} from './nano-view-block-template-nodes'
import {
  markdownOrderedMarkerText,
  templateText,
} from './nano-view-block-template-markdown'
import { footnoteName } from './nano-footnote'
import { nanoNodeNames } from './prosemirror-names'
import { continuationMarkerInputTransaction } from './nano-view-continuation-markers'

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

function headingMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== '#' || $from.parentOffset !== 0 || block.type.name !== nanoNodeNames.heading) return null

  const level = typeof block.attrs.level === 'number' ? block.attrs.level : 1
  if (level >= 6) return state.tr.setSelection(TextSelection.create(state.doc, $from.before() + 1))

  const blockPosition = $from.before()
  const transaction = state.tr.setNodeMarkup(blockPosition, block.type, {
    ...block.attrs,
    level: level + 1,
    headingStyle: 'atx',
    atxClosingLength: null,
    atxClosingSpacing: null,
  })
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

function todoMarkerInputTransaction(
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

function listMarkerInputTransaction(
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

function todoCheckboxInputTransaction(
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

function quoteMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== '>' || $from.parentOffset !== 0) return null

  if (block.type.name === nanoNodeNames.quote) {
    const transaction = state.tr.setNodeMarkup($from.before(), block.type, {
      ...block.attrs,
      quoteMarkerDepths: incrementQuoteDepths(block.attrs.quoteMarkerDepths, block.textContent),
    })
    transaction.setSelection(TextSelection.create(transaction.doc, $from.before() + 1))
    return transaction
  }

  if (block.type.name === nanoNodeNames.callout) {
    const transaction = state.tr.setNodeMarkup($from.before(), block.type, {
      ...block.attrs,
      calloutMarkerDepths: incrementQuoteDepths(block.attrs.calloutMarkerDepths, block.textContent),
    })
    transaction.setSelection(TextSelection.create(transaction.doc, $from.before() + 1))
    return transaction
  }

  return null
}

function calloutMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== ' ' || block.type.name !== nanoNodeNames.quote) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset) return null

  const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/i.exec(textBefore)
  if (!match) return null

  const calloutType = state.schema.nodes[nanoNodeNames.callout]
  if (!calloutType) return null

  const blockPosition = $from.before()
  const callout = calloutType.create({
    id: block.attrs.id,
    tone: calloutToneFromInput(match[1]),
    calloutMarkerDepths: quoteMarkerDepthsOrNull(block.attrs.quoteMarkerDepths),
    calloutMarkerSpacing: quoteMarkerSpacingOrNull(block.attrs.quoteMarkerSpacing),
    calloutTextSpacing: 'space',
  }, block.content.cut($from.parentOffset))
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, callout)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

function incrementQuoteDepths(depths: unknown, text: string): number[] {
  const lineCount = Math.max(1, text.split('\n').length)
  const normalized = quoteMarkerDepthsOrNull(depths) ?? []
  return Array.from({ length: lineCount }, (_value, index) => (normalized[index] ?? 1) + 1)
}

function calloutToneFromInput(tone: unknown): 'note' | 'tip' | 'important' | 'warning' | 'caution' {
  const normalized = typeof tone === 'string' ? tone.toLowerCase() : ''
  return normalized === 'tip'
    || normalized === 'important'
    || normalized === 'warning'
    || normalized === 'caution'
    ? normalized
    : 'note'
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

function blockShortcutTransactionForTemplate(
  state: EditorState,
  $from: ResolvedPos,
  template: BlockTemplate,
): Transaction | null {
  const block = $from.parent
  const blockPosition = $from.before()
  const id = typeof block.attrs.id === 'string' && block.attrs.id ? block.attrs.id : generatedBlockId('b', 'shortcut')
  const inserted = insertedContentForShortcutTemplate(state.doc, template, id)
  if (!inserted) return null

  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, inserted)
  transaction.setSelection(templateText(template) === null
    ? selectionAfterInsertedContent(transaction.doc, blockPosition, inserted)
    : selectionAfterMarkdownLineEnter(transaction.doc, blockPosition, inserted))
  return transaction
}
