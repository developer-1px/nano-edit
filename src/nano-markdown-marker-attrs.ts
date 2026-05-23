import type {
  BulletMarker,
  DividerMarker,
  OrderedMarker,
} from './nano-markdown-types'

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
