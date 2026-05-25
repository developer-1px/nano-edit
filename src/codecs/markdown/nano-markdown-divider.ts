import type { NanoBlock } from '../../core/nano-core'
import { dividerMarker } from './nano-markdown-block-attrs'
import { nextMarkdownBlockId } from './nano-markdown-state'
import type {
  DividerMarker,
  MarkdownParseState,
} from './nano-markdown-types'

export function parseDividerLine(trimmed: string, state: MarkdownParseState): NanoBlock | null {
  const divider = dividerMarkerOrNull(trimmed)
  if (!divider) return null

  return {
    id: nextMarkdownBlockId(state),
    type: 'divider',
    ...(divider.marker !== '---' ? { marker: divider.marker } : {}),
    ...(divider.length !== 3 ? { markerLength: divider.length } : {}),
  }
}

export function dividerMarkdown(marker: unknown, length: unknown): string {
  return dividerMarkerChar(marker).repeat(dividerMarkerLength(length))
}

function dividerMarkerOrNull(marker: string): { marker: DividerMarker; length: number } | null {
  if (/^-{3,}$/.test(marker)) return { marker: '---', length: marker.length }
  if (/^\*{3,}$/.test(marker)) return { marker: '***', length: marker.length }
  if (/^_{3,}$/.test(marker)) return { marker: '___', length: marker.length }
  return null
}

function dividerMarkerChar(marker: unknown): '-' | '*' | '_' {
  return dividerMarker(marker)[0] as '-' | '*' | '_'
}

function dividerMarkerLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}
