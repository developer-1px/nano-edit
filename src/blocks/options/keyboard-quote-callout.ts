import { TextSelection, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../../assembly/capability'
import { setParagraphTransaction } from './keyboard-paragraph'
import { quoteMarkerDepthsOrNull, quoteMarkerSpacingOrNull, quoteMarkerSpacingValueOrNull } from '../../core/nano-source-metadata'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-nano'

export function decreaseQuoteAtStartThenParagraph(context: BlockKeyboardContext): Transaction | null {
  if (context.$from.parentOffset !== 0) return null

  const depths = quoteDepths(context.block.attrs.quoteMarkerDepths, context.block.textContent)
  if (!depths.some((depth) => depth > 1)) {
    return setParagraphTransaction(context.state, context.blockPosition, context.block.attrs.id)
  }

  const transaction = context.state.tr.setNodeMarkup(context.blockPosition, context.block.type, {
    ...context.block.attrs,
    quoteMarkerDepths: normalizedDepths(depths.map((depth) => Math.max(1, depth - 1))),
  })
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
  return transaction
}

export function decreaseCalloutAtStartThenQuote(context: BlockKeyboardContext): Transaction | null {
  if (context.$from.parentOffset !== 0) return null

  const depths = quoteDepths(context.block.attrs.calloutMarkerDepths, context.block.textContent)
  if (depths.some((depth) => depth > 1)) {
    const transaction = context.state.tr.setNodeMarkup(context.blockPosition, context.block.type, {
      ...context.block.attrs,
      calloutMarkerDepths: normalizedDepths(depths.map((depth) => Math.max(1, depth - 1))),
    })
    transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
    return transaction
  }

  const quoteType = context.state.schema.nodes[nanoNodeNames.quote]
  if (!quoteType) return null

  const quote = quoteType.create({
    id: context.block.attrs.id,
    quoteMarkerDepths: quoteMarkerDepthsOrNull(context.block.attrs.calloutMarkerDepths),
    quoteMarkerSpacing: quoteSpacingAfterCalloutMarkerRemoval(context.block.attrs, context.block.textContent),
  }, context.block.content)
  const transaction = context.state.tr.replaceWith(context.blockPosition, context.blockPosition + context.block.nodeSize, quote)
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
  return transaction
}

function quoteSpacingAfterCalloutMarkerRemoval(attrs: Record<string, unknown>, text: string): Array<'space' | 'none'> | null {
  const lines = text.split('\n')
  const sourceSpacing = quoteMarkerSpacingOrNull(attrs.calloutMarkerSpacing) ?? []
  const first = quoteMarkerSpacingValueOrNull(attrs.calloutTextSpacing) ?? (lines[0] ? 'space' : 'none')
  const spacing = lines.map((_line, index) => index === 0 ? first : sourceSpacing[index] ?? 'space')
  return spacing.length > 0 ? spacing : null
}

function quoteDepths(depths: unknown, text: string): number[] {
  const lineCount = Math.max(1, text.split('\n').length)
  const normalized = quoteMarkerDepthsOrNull(depths) ?? []
  return Array.from({ length: lineCount }, (_value, index) => normalized[index] ?? 1)
}

function normalizedDepths(depths: number[]): number[] | null {
  return depths.some((depth) => depth !== 1) ? depths : null
}
