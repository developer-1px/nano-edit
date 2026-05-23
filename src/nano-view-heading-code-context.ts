import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { headingLevel } from './nano-block-structure'

export function headingContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  const level = headingLevel(replacement)
  if (sourceHeadingStyle(source) === 'setext') {
    return level <= 2
      ? {
          headingStyle: 'setext',
          setextLength: headingSetextLength(source.attrs.setextLength),
          setextMarker: level === 1 ? '=' : '-',
        }
      : { headingStyle: 'atx' }
  }

  const closingLength = headingAtxClosingLength(source.attrs.atxClosingLength)
  return {
    headingStyle: 'atx',
    ...(headingAtxSpacingOrNull(source.attrs.atxTextSpacing)
      ? { atxTextSpacing: headingAtxSpacingOrNull(source.attrs.atxTextSpacing) }
      : {}),
    ...(closingLength ? { atxClosingLength: closingLength } : {}),
    ...(closingLength && headingAtxSpacingOrNull(source.attrs.atxClosingSpacing)
      ? { atxClosingSpacing: headingAtxSpacingOrNull(source.attrs.atxClosingSpacing) }
      : {}),
  }
}

export function codeBlockContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  const language = typeof replacement.attrs.language === 'string' && replacement.attrs.language
    ? replacement.attrs.language
    : typeof source.attrs.language === 'string' && source.attrs.language
      ? source.attrs.language
      : null

  return {
    language,
    ...(codeFenceIndentOrNull(source.attrs.fenceIndent) ? { fenceIndent: codeFenceIndentOrNull(source.attrs.fenceIndent) } : {}),
    ...(codeFenceInfoSpacingOrNull(source.attrs.fenceInfoSpacing) ? { fenceInfoSpacing: codeFenceInfoSpacingOrNull(source.attrs.fenceInfoSpacing) } : {}),
    fenceMarker: markdownCodeFenceMarker(source.attrs.fenceMarker),
    fenceLength: markdownCodeFenceLength(source.attrs.fenceLength),
  }
}

function sourceHeadingStyle(node: ProseMirrorNode): 'atx' | 'setext' {
  return node.attrs.headingStyle === 'setext' && headingLevel(node) <= 2 ? 'setext' : 'atx'
}

function headingSetextLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(1, value)
}

function headingAtxClosingLength(length: unknown): number | null {
  if (length === null || length === undefined || length === '') return null
  const value = typeof length === 'number' ? length : Number(length)
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null
}

function headingAtxSpacingOrNull(spacing: unknown): number | null {
  const value = typeof spacing === 'number' && Number.isFinite(spacing) ? Math.max(1, Math.trunc(spacing)) : 1
  return value === 1 ? null : value
}

function codeFenceIndentOrNull(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

function codeFenceInfoSpacingOrNull(spacing: unknown): string | null {
  return typeof spacing === 'string' && /^[\t ]+$/.test(spacing) ? spacing : null
}

function markdownCodeFenceMarker(marker: unknown): '`' | '~' {
  return marker === '~' ? '~' : '`'
}

function markdownCodeFenceLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}
