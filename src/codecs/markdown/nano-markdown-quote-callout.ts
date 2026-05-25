import type { NanoBlock } from '../../core/nano-core'
import {
  calloutLine,
  isQuoteLine,
  quoteLine,
} from './nano-markdown-quote-lines'
import { textBlock } from './nano-markdown-text-block'
import type {
  MarkdownParseState,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
} from './nano-markdown-types'

export {
  isQuoteLine,
} from './nano-markdown-quote-lines'
export {
  markdownCallout,
  markdownQuote,
} from './nano-markdown-quote-serialize'

export function parseQuote(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  if (!isQuoteLine(lines[index]!)) return null

  const quoteLines: string[] = []
  const quoteMarkerSpacing: QuoteMarkerSpacing[] = []
  const quoteMarkerDepths: QuoteMarkerDepth[] = []
  let nextIndex = index
  while (nextIndex < lines.length && isQuoteLine(lines[nextIndex]!)) {
    const quote = quoteLine(lines[nextIndex]!)
    if (!quote) break
    quoteLines.push(quote.text)
    quoteMarkerSpacing.push(quote.markerSpacing)
    quoteMarkerDepths.push(quote.markerDepth)
    nextIndex += 1
  }

  return {
    block: textBlock('quote', quoteLines.join('\n'), state, { quoteMarkerSpacing, quoteMarkerDepths }),
    nextIndex,
  }
}

export function parseCallout(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const opener = calloutLine(lines[index]!)
  if (!opener) return null

  const content = [opener.text]
  const calloutMarkerDepths = [opener.markerDepth]
  const calloutMarkerSpacing = [opener.markerSpacing]
  let nextIndex = index + 1
  while (nextIndex < lines.length && isQuoteLine(lines[nextIndex]!)) {
    const quote = quoteLine(lines[nextIndex]!)
    if (!quote) break
    content.push(quote.text)
    calloutMarkerDepths.push(quote.markerDepth)
    calloutMarkerSpacing.push(quote.markerSpacing)
    nextIndex += 1
  }

  return {
    block: textBlock('callout', content.join('\n'), state, {
      tone: opener.tone,
      calloutMarkerDepths,
      calloutMarkerSpacing,
      calloutTextSpacing: opener.textSpacing,
    }),
    nextIndex,
  }
}
