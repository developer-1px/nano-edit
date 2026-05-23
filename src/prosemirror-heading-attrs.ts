import type { DOMOutputSpec } from 'prosemirror-model'
import { sourceTokenAttrs } from './prosemirror-source-token'

export function clampHeadingLevel(level: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  const value = typeof level === 'number' ? Math.trunc(level) : 1
  return clamp(value, 1, 6) as 1 | 2 | 3 | 4 | 5 | 6
}

export function headingStyle(style: unknown, level: unknown): 'atx' | 'setext' {
  const headingLevel = clampHeadingLevel(level)
  return style === 'setext' && headingLevel <= 2 ? 'setext' : 'atx'
}

export function setextMarker(marker: unknown, level: unknown): '=' | '-' {
  if (marker === '=' || marker === '-') return marker
  return clampHeadingLevel(level) === 1 ? '=' : '-'
}

export function setextLength(length: unknown): number {
  const value = typeof length === 'number'
    ? length
    : typeof length === 'string'
      ? Number(length)
      : 3
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 3
}

export function atxClosingLengthOrNull(length: unknown): number | null {
  if (length === null || length === undefined || length === '') return null
  const value = typeof length === 'number'
    ? length
    : typeof length === 'string'
      ? Number(length)
      : null
  return value !== null && Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null
}

export function atxSpacing(spacing: unknown): number {
  const value = typeof spacing === 'number'
    ? spacing
    : typeof spacing === 'string'
      ? Number(spacing)
      : 1
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
}

export function atxSpacingOrNull(spacing: unknown): number | null {
  const value = atxSpacing(spacing)
  return value === 1 ? null : value
}

export function headingPrefixToken(style: unknown, level: unknown, atxTextSpacing?: unknown): string {
  return headingStyle(style, level) === 'setext' ? '' : `${'#'.repeat(clampHeadingLevel(level))}${' '.repeat(atxSpacing(atxTextSpacing))}`
}

export function headingSuffixDomSpec(
  style: unknown,
  level: unknown,
  atxClosingLength: unknown,
  atxClosingSpacing: unknown,
  setextMarkerValue: unknown,
  setextLengthValue: unknown,
): DOMOutputSpec[] {
  if (headingStyle(style, level) === 'setext') {
    return [[
      'span',
      sourceTokenAttrs('nano-block-md-prefix nano-heading-setext-marker', { contenteditable: 'false' }),
      ` ${setextMarker(setextMarkerValue, level).repeat(setextLength(setextLengthValue))}`,
    ]]
  }

  const closingLength = atxClosingLengthOrNull(atxClosingLength)
  return closingLength
    ? [['span', sourceTokenAttrs('nano-block-md-prefix nano-heading-atx-close', { contenteditable: 'false' }), `${' '.repeat(atxSpacing(atxClosingSpacing))}${'#'.repeat(closingLength)}`]]
    : []
}

export function headingAtxAttrs(
  atxClosingLength: unknown,
  atxClosingSpacingValue: unknown,
  atxTextSpacingValue: unknown,
): { atxClosingLength?: number; atxClosingSpacing?: number; atxTextSpacing?: number } {
  const closingLength = atxClosingLengthOrNull(atxClosingLength)
  const closingSpacing = atxSpacingOrNull(atxClosingSpacingValue)
  const textSpacing = atxSpacingOrNull(atxTextSpacingValue)
  return {
    ...(closingLength ? { atxClosingLength: closingLength } : {}),
    ...(closingSpacing ? { atxClosingSpacing: closingSpacing } : {}),
    ...(textSpacing ? { atxTextSpacing: textSpacing } : {}),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
