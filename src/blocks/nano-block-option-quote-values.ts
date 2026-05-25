import type {
  CalloutTone,
  QuoteMarkerSpacing,
} from '../assembly/capability'

export const calloutTones = ['note', 'tip', 'important', 'warning', 'caution'] as const satisfies readonly CalloutTone[]
export const calloutPattern = '(NOTE|TIP|IMPORTANT|WARNING|CAUTION)'

export function quoteMarkerSpacing(spacing: unknown): QuoteMarkerSpacing[] | null {
  return Array.isArray(spacing) && spacing.length > 0
    ? spacing.map((value) => value === 'none' ? 'none' : 'space')
    : null
}

export function quoteMarkerDepths(depths: unknown): number[] | null {
  if (!Array.isArray(depths) || depths.length === 0) return null
  const normalized = depths.map(quoteMarkerDepth)
  return normalized.some((value) => value !== 1) ? normalized : null
}

export function quoteMarkerDepth(depth: unknown): number {
  if (typeof depth === 'string') {
    const value = [...depth].filter((char) => char === '>').length
    return Math.max(1, value)
  }

  return typeof depth === 'number' && Number.isFinite(depth)
    ? Math.max(1, Math.trunc(depth))
    : 1
}

export function quoteMarkerSpacingValue(spacing: unknown): QuoteMarkerSpacing | null {
  return spacing === 'space' || spacing === 'none' ? spacing : null
}

export function calloutTone(tone: unknown): CalloutTone {
  const normalized = typeof tone === 'string' ? tone.toLowerCase() : ''
  return isCalloutTone(normalized) ? normalized : 'note'
}

function isCalloutTone(tone: string): tone is CalloutTone {
  return (calloutTones as readonly string[]).includes(tone)
}
