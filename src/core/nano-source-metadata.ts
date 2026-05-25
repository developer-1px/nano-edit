type SourceLineAttrName =
  | 'quoteMarkerSpacing'
  | 'quoteMarkerDepths'
  | 'calloutMarkerDepths'
  | 'calloutMarkerSpacing'

export type QuoteMarkerSpacing = 'space' | 'none'

const sourceLineAttrs: readonly SourceLineAttrName[] = [
  'quoteMarkerSpacing',
  'quoteMarkerDepths',
  'calloutMarkerDepths',
  'calloutMarkerSpacing',
]

export function attrsWithSlicedSourceLineAttrs(
  attrs: Record<string, unknown>,
  start: number,
  count: number,
): Record<string, unknown> {
  const next = { ...attrs }
  for (const name of sourceLineAttrs) {
    const values = Array.isArray(attrs[name]) ? attrs[name].slice(start, start + count) : []
    if (values.length > 0) {
      next[name] = values
    } else {
      delete next[name]
    }
  }
  return next
}

export function quoteMarkerSpacingOrNull(spacing: unknown): QuoteMarkerSpacing[] | null {
  if (!Array.isArray(spacing) || spacing.length === 0) return null
  return spacing.map((value) => value === 'none' ? 'none' : 'space')
}

export function quoteMarkerDepthsOrNull(depths: unknown): number[] | null {
  if (!Array.isArray(depths) || depths.length === 0) return null
  const normalized = depths.map((depth) => {
    const value = typeof depth === 'number' && Number.isFinite(depth) ? Math.trunc(depth) : 1
    return Math.max(1, value)
  })
  return normalized.length > 0 ? normalized : null
}

export function quoteMarkerSpacingValueOrNull(spacing: unknown): QuoteMarkerSpacing | null {
  return spacing === 'space' || spacing === 'none' ? spacing : null
}

export function shiftedRawIndent(indent: unknown, delta: number): string | null {
  if (typeof indent !== 'string' || !/^[\t ]+$/.test(indent)) return null
  if (delta === 0) return indent
  if (delta > 0) return `${'  '.repeat(delta)}${indent}`

  let shifted = indent
  for (let index = 0; index < Math.abs(delta); index += 1) {
    shifted = removeOneIndentLevel(shifted)
  }
  return shifted ? shifted : null
}

export function shiftedContinuationIndents(indents: unknown, delta: number): string[] | null {
  if (!Array.isArray(indents) || indents.length === 0) return null

  const shifted = indents
    .map((indent) => shiftedRawIndent(indent, delta))
    .filter((indent): indent is string => indent !== null)
  return shifted.length > 0 ? shifted : null
}

function removeOneIndentLevel(indent: string): string {
  if (indent.startsWith('  ')) return indent.slice(2)
  if (indent.startsWith('\t')) return indent.slice(1)
  return ''
}
