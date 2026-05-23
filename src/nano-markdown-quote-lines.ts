import {
  calloutTone,
  quoteMarkerDepth,
} from './nano-markdown-block-attrs'
import type {
  CalloutTone,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
} from './nano-markdown-types'

export function isQuoteLine(line: string): boolean {
  return /^>+\s?/.test(line)
}

export function quoteLine(line: string): { text: string; markerDepth: QuoteMarkerDepth; markerSpacing: QuoteMarkerSpacing } | null {
  const match = /^(>+)( ?)(.*)$/.exec(line)
  if (!match) return null

  return {
    text: match[3] ?? '',
    markerDepth: quoteMarkerDepth(match[1]?.length),
    markerSpacing: match[2] === ' ' ? 'space' : 'none',
  }
}

export function calloutLine(line: string): {
  markerDepth: QuoteMarkerDepth
  tone: CalloutTone
  text: string
  markerSpacing: QuoteMarkerSpacing
  textSpacing: QuoteMarkerSpacing
} | null {
  const match = /^(>+)( ?)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]( ?)(.*)$/i.exec(line)
  if (!match) return null

  return {
    markerDepth: quoteMarkerDepth(match[1]?.length),
    tone: calloutTone(match[3]),
    text: match[5] ?? '',
    markerSpacing: match[2] === ' ' ? 'space' : 'none',
    textSpacing: match[4] === ' ' ? 'space' : 'none',
  }
}
