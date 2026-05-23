export function dividerMarker(marker: unknown): '---' | '***' | '___' {
  if (typeof marker === 'string' && marker.startsWith('*')) return '***'
  if (typeof marker === 'string' && marker.startsWith('_')) return '___'
  return '---'
}

export function dividerMarkdown(marker: unknown, length: unknown): string {
  return dividerMarkerChar(marker).repeat(dividerMarkerLength(length))
}

export function dividerMarkerLength(length: unknown): number {
  const value = typeof length === 'number'
    ? length
    : typeof length === 'string'
      ? Number(length)
      : 3
  return Number.isFinite(value) ? Math.max(3, Math.trunc(value)) : 3
}

export function codeFenceMarker(marker: unknown): '`' | '~' {
  return marker === '~' ? '~' : '`'
}

export function codeFenceLength(length: unknown): number {
  const value = typeof length === 'number'
    ? length
    : typeof length === 'string'
      ? Number(length)
      : 3
  return Number.isFinite(value) ? Math.max(3, Math.trunc(value)) : 3
}

export function codeFenceIndent(indent: unknown): string {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : ''
}

export function codeFenceInfoSpacing(spacing: unknown): string {
  return typeof spacing === 'string' && /^[\t ]+$/.test(spacing) ? spacing : ''
}

export function codeFenceOpenToken(
  language: unknown,
  marker: unknown,
  length: unknown,
  indent: unknown,
  infoSpacing: unknown,
): string {
  const info = typeof language === 'string' ? language : ''
  const spacing = info ? codeFenceInfoSpacing(infoSpacing) : ''
  return `${codeFenceIndent(indent)}${codeFenceToken(marker, length)}${spacing}${info}`
}

export function codeFenceCloseToken(marker: unknown, length: unknown, indent: unknown): string {
  return `${codeFenceIndent(indent)}${codeFenceToken(marker, length)}`
}

function dividerMarkerChar(marker: unknown): '-' | '*' | '_' {
  return dividerMarker(marker)[0] as '-' | '*' | '_'
}

function codeFenceToken(marker: unknown, length: unknown): string {
  return codeFenceMarker(marker).repeat(codeFenceLength(length))
}
