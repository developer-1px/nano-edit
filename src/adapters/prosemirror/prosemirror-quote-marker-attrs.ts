export type CalloutTone = 'note' | 'tip' | 'important' | 'warning' | 'caution'

export function quotePrefixToken(spacing: unknown, depths?: unknown): string {
  const marker = '>'.repeat(normalizeQuoteMarkerDepths(depths)?.[0] ?? 1)
  return normalizeQuoteMarkerSpacing(spacing)?.[0] === 'none' ? marker : `${marker} `
}

export function calloutMarkerToken(tone: CalloutTone, markerSpacing: unknown, markerDepths: unknown, textSpacing: unknown): string {
  return `${quotePrefixToken(markerSpacing, markerDepths)}[!${tone.toUpperCase()}]${quoteMarkerSpacingValue(textSpacing) === 'space' ? ' ' : ''}`
}

export function normalizeQuoteMarkerSpacing(spacing: unknown): Array<'space' | 'none'> | null {
  if (typeof spacing === 'string') return decodeQuoteMarkerSpacing(spacing)
  if (!Array.isArray(spacing) || spacing.length === 0) return null
  return spacing.map((value) => value === 'none' ? 'none' : 'space')
}

export function quoteMarkerSpacingValue(spacing: unknown): 'space' | 'none' | null {
  return spacing === 'space' || spacing === 'none' ? spacing : null
}

export function textSpacingValue(spacing: unknown): 'space' | 'none' | null {
  return spacing === 'none' ? 'none' : spacing === 'space' ? 'space' : null
}

export function encodeQuoteMarkerSpacing(spacing: unknown): string | null {
  const normalized = normalizeQuoteMarkerSpacing(spacing)
  return normalized?.map((value) => value === 'none' ? 'n' : 's').join('') ?? null
}

export function decodeQuoteMarkerSpacing(spacing: unknown): Array<'space' | 'none'> | null {
  if (typeof spacing !== 'string' || !spacing) return null
  return [...spacing].map((value) => value === 'n' ? 'none' : 'space')
}

export function normalizeQuoteMarkerDepths(depths: unknown): number[] | null {
  if (typeof depths === 'string') return decodeQuoteMarkerDepths(depths)
  if (!Array.isArray(depths) || depths.length === 0) return null

  const normalized = depths.map(quoteMarkerDepth)
  return normalized.some((value) => value !== 1) ? normalized : null
}

export function quoteMarkerDepth(depth: unknown): number {
  const value = typeof depth === 'number'
    ? depth
    : typeof depth === 'string'
      ? Number(depth)
      : 1
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
}

export function encodeQuoteMarkerDepths(depths: unknown): string | null {
  return normalizeQuoteMarkerDepths(depths)?.join(',') ?? null
}

export function decodeQuoteMarkerDepths(depths: unknown): number[] | null {
  if (typeof depths !== 'string' || !depths) return null
  const normalized = depths.split(',').map(quoteMarkerDepth)
  return normalized.some((value) => value !== 1) ? normalized : null
}

export function calloutTone(tone: unknown): CalloutTone {
  return tone === 'tip'
    || tone === 'important'
    || tone === 'warning'
    || tone === 'caution'
    ? tone
    : 'note'
}
