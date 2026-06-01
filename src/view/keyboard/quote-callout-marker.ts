import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import {
  quoteMarkerDepthsOrNull,
  quoteMarkerSpacingOrNull,
} from '../../core/nano-source-metadata'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'

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
