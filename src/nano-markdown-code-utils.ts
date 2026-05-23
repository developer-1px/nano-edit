import type { CodeFenceMarker } from './nano-markdown-types'

export interface CodeFenceOpener {
  fence: string
  indent?: string
  info?: string
  infoSpacing?: string
  marker: CodeFenceMarker
  length: number
}

export function longestFenceMarkerRun(text: string, marker: CodeFenceMarker): number {
  const pattern = marker === '`' ? /`+/g : /~+/g
  return Math.max(0, ...Array.from(text.matchAll(pattern), (match) => match[0].length))
}

export function codeFenceMarker(marker: unknown): CodeFenceMarker {
  return marker === '~' ? '~' : '`'
}

export function codeFenceLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}

export function codeFenceIndent(indent: unknown): string {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : ''
}

export function codeFenceInfoSpacing(spacing: unknown): string {
  return typeof spacing === 'string' && /^[\t ]+$/.test(spacing) ? spacing : ''
}

export function codeFenceInfo(info: unknown): string | undefined {
  const value = typeof info === 'string'
    ? info.replace(/[`~\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
  return value || undefined
}
