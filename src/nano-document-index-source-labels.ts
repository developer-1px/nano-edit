export function dividerMarkdown(marker: unknown, length: unknown): string {
  return dividerMarkerChar(marker).repeat(dividerMarkerLength(length))
}

export function dividerMarker(marker: unknown): '---' | '***' | '___' {
  if (typeof marker === 'string' && marker.startsWith('*')) return '***'
  if (typeof marker === 'string' && marker.startsWith('_')) return '___'
  return '---'
}

export function dividerMarkerChar(marker: unknown): '-' | '*' | '_' {
  return dividerMarker(marker)[0] as '-' | '*' | '_'
}

export function dividerMarkerLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}

export function codeFenceToken(marker: unknown, length: unknown): string {
  return codeFenceMarker(marker).repeat(codeFenceLength(length))
}

export function codeFenceMarker(marker: unknown): '`' | '~' {
  return marker === '~' ? '~' : '`'
}

export function codeFenceLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}
