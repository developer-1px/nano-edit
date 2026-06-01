import type {
  BulletMarker,
  DividerMarker,
  OrderedMarker,
} from '../../assembly/capability'

export function bulletMarker(marker: unknown): BulletMarker {
  return marker === '*' || marker === '+' ? marker : '-'
}

export function orderedMarker(marker: unknown): OrderedMarker {
  return marker === ')' ? ')' : '.'
}

export function dividerMarker(marker: unknown): DividerMarker {
  if (typeof marker === 'string' && marker.startsWith('*')) return '***'
  if (typeof marker === 'string' && marker.startsWith('_')) return '___'
  return '---'
}

export function dividerMarkerLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}
