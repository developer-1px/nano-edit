import type { CodeFenceMarker } from '../assembly/capability'

export function codeFenceMarker(marker: unknown): CodeFenceMarker {
  return marker === '~' ? '~' : '`'
}

export function codeFenceLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}

export function codeFenceSpacing(spacing: unknown): string {
  return typeof spacing === 'string' && /^[\t ]+$/.test(spacing) ? spacing : ''
}

export function codeFenceInfo(info: unknown): string | undefined {
  const value = typeof info === 'string'
    ? info.replace(/[\r\n]+/g, ' ').trim()
    : ''
  return value || undefined
}

export function mathFormula(source: unknown): string {
  return typeof source === 'string'
    ? source.replace(/\r\n?/g, '\n').trim()
    : ''
}

export function mathStyle(style: unknown): 'single' | '' {
  return style === 'single' ? style : ''
}
