import type {
  CalloutTone,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
} from './nano-markdown-types'

export function quoteMarkerSpacing(spacing: readonly QuoteMarkerSpacing[]): QuoteMarkerSpacing[] {
  return spacing.map((value) => quoteMarkerSpacingValue(value, ''))
}

export function quoteMarkerDepthAttrs(depths: readonly QuoteMarkerDepth[]): { quoteMarkerDepths?: QuoteMarkerDepth[] } {
  const normalized = depths.map(quoteMarkerDepth)
  return normalized.some((value) => value !== 1) ? { quoteMarkerDepths: normalized } : {}
}

export function calloutMarkerDepthAttrs(depths: readonly QuoteMarkerDepth[]): { calloutMarkerDepths?: QuoteMarkerDepth[] } {
  const normalized = depths.map(quoteMarkerDepth)
  return normalized.some((value) => value !== 1) ? { calloutMarkerDepths: normalized } : {}
}

export function quoteMarkerDepth(depth: unknown): QuoteMarkerDepth {
  const value = typeof depth === 'number' && Number.isFinite(depth) ? Math.trunc(depth) : 1
  return Math.max(1, value)
}

export function quoteMarkerSpacingValue(value: unknown, line: string): QuoteMarkerSpacing {
  if (value === 'space' || value === 'none') return value
  return line ? 'space' : 'none'
}

export function calloutTextSpacingValue(value: unknown, firstLine: string): QuoteMarkerSpacing {
  if (value === 'space' || value === 'none') return value
  return firstLine ? 'space' : 'none'
}

export function calloutTone(tone: unknown): CalloutTone {
  const normalized = typeof tone === 'string' ? tone.toLowerCase() : ''
  return normalized === 'tip'
    || normalized === 'important'
    || normalized === 'warning'
    || normalized === 'caution'
    ? normalized
    : 'note'
}
