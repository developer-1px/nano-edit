import type { NanoBlock } from '../../core/nano-core'
import {
  calloutTextSpacingValue,
  quoteMarkerDepth,
  quoteMarkerSpacingValue,
} from './nano-markdown-block-attrs'
import { inlineMarkdown } from './nano-markdown-inline-serialize'
import type {
  CalloutTone,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
} from './nano-markdown-types'

export function markdownCallout(
  tone: CalloutTone,
  text: string,
  markerSpacing?: readonly QuoteMarkerSpacing[],
  markerDepths?: readonly QuoteMarkerDepth[],
  textSpacing?: QuoteMarkerSpacing,
): string {
  const lines = text.split('\n')
  const first = lines[0] ?? ''
  const marker = `${quoteMarkerPrefix(markerSpacing?.[0], markerDepths?.[0])}[!${tone.toUpperCase()}]`
  const firstTextSpacing = calloutTextSpacingValue(textSpacing, first)
  return [
    first ? `${marker}${firstTextSpacing === 'space' ? ' ' : ''}${first}` : marker,
    ...lines.slice(1).map((line, index) => markdownQuoteLine(line, markerSpacing?.[index + 1], markerDepths?.[index + 1])),
  ].join('\n')
}

export function markdownQuote(block: Extract<NanoBlock, { type: 'quote' }>): string {
  return inlineMarkdown(block.text, block.marks)
    .split('\n')
    .map((line, index) => markdownQuoteLine(line, block.quoteMarkerSpacing?.[index], block.quoteMarkerDepths?.[index]))
    .join('\n')
}

function markdownQuoteLine(line: string, markerSpacing: unknown, markerDepth?: unknown): string {
  const spacing = quoteMarkerSpacingValue(markerSpacing, line)
  const marker = '>'.repeat(quoteMarkerDepth(markerDepth))
  return spacing === 'space' ? `${marker} ${line}` : `${marker}${line}`
}

function quoteMarkerPrefix(markerSpacing: unknown, markerDepth?: unknown): string {
  const marker = '>'.repeat(quoteMarkerDepth(markerDepth))
  return quoteMarkerSpacingValue(markerSpacing, '') === 'space' ? `${marker} ` : marker
}
