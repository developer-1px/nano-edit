export function boldMarker(marker: unknown): '**' | '__' {
  return marker === '__' ? '__' : '**'
}

export function italicMarker(marker: unknown): '*' | '_' {
  return marker === '_' ? '_' : '*'
}

export function codeBacktickToken(length: unknown): string {
  return '`'.repeat(codeBacktickLength(length))
}

export function codeBacktickLength(length: unknown): number {
  const value = typeof length === 'number'
    ? length
    : typeof length === 'string'
      ? Number(length)
      : 1
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
}
