import type {
  BulletMarker,
  CheckedMarker,
  DividerMarker,
  OrderedMarker,
} from './nano-markdown-types'

export function bulletMarker(marker: unknown): BulletMarker {
  return marker === '*' || marker === '+' ? marker : '-'
}

export function orderedMarker(marker: unknown): OrderedMarker {
  return marker === ')' ? ')' : '.'
}

export function checkedMarker(marker: unknown): CheckedMarker {
  return marker === 'X' ? 'X' : 'x'
}

export function dividerMarker(marker: unknown): DividerMarker {
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
  if (!Number.isFinite(value)) return 3
  return Math.max(3, Math.trunc(value))
}

function dividerMarkerChar(marker: unknown): '-' | '*' | '_' {
  const normalized = dividerMarker(marker)
  if (normalized === '***') return '*'
  if (normalized === '___') return '_'
  return '-'
}
