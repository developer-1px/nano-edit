import type { SetextMarker } from './nano-markdown-types'

export function setextMarker(marker: unknown, level: unknown): SetextMarker {
  if (marker === '=' || marker === '-') return marker
  return level === 1 ? '=' : '-'
}

export function setextLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(1, value)
}

export function atxClosingLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 1
  return Math.max(1, value)
}

export function atxSpacing(spacing: unknown): number {
  const value = typeof spacing === 'number' && Number.isFinite(spacing) ? Math.trunc(spacing) : 1
  return Math.max(1, value)
}
