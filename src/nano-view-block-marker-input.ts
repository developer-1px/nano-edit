import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import { footnoteName } from './nano-footnote'
import { atxSpacing } from './prosemirror-block-attrs'
import {
  quoteMarkerDepthsOrNull,
  quoteMarkerSpacingOrNull,
} from './nano-source-metadata'
import { markdownOrderedMarkerText } from './nano-view-block-template-markdown'
import { blockShortcutTransactionForTemplate } from './nano-view-block-shortcut-template'
import { nanoNodeNames } from './prosemirror-names'

export function headingMarkerInputTransaction(
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

export function headingMarkerSpaceInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (
    text !== ' '
    || $from.parentOffset !== 0
    || block.type.name !== nanoNodeNames.heading
    || block.attrs.headingStyle === 'setext'
  ) {
    return null
  }

  const blockPosition = $from.before()
  const spacing = atxSpacing(block.attrs.atxTextSpacing)
  if (spacing <= 1) return state.tr.setSelection(TextSelection.create(state.doc, blockPosition + 1))

  const transaction = state.tr.setNodeMarkup(blockPosition, block.type, {
    ...block.attrs,
    atxTextSpacing: spacing + 1,
  })
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

export function headingPrefixInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== '#' || block.type.name !== nanoNodeNames.paragraph) return null

  if ($from.parentOffset === 0 && block.textContent.length > 0) {
    const headingType = state.schema.nodes[nanoNodeNames.heading]
    if (!headingType) return null

    const blockPosition = $from.before()
    const transaction = state.tr.setNodeMarkup(blockPosition, headingType, {
      id: block.attrs.id,
      level: 1,
      headingStyle: 'atx',
    })
    transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
    return transaction
  }

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset || block.textContent.length !== textBefore.length) return null

  const source = textBefore + text
  if (!/^#{1,6}$/.test(source)) return null

  return blockShortcutTransactionForTemplate(state, $from, {
    type: 'heading',
    level: source.length,
    text: '',
  })
}

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

export function footnoteMarkerInputTransaction(
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

export function quoteMarkerInputTransaction(
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

export function calloutMarkerInputTransaction(
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
