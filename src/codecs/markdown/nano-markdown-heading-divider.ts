import type { NanoBlock } from '../../core/nano-core'
import {
  atxClosingLength,
  atxSpacing,
  setextLength,
  setextMarker,
} from './nano-markdown-block-attrs'
import { inlineMarkdown } from './nano-markdown-inline-serialize'
import { textBlock } from './nano-markdown-text-block'
import type {
  MarkdownParseState,
  SetextMarker,
} from './nano-markdown-types'

export {
  dividerMarkdown,
  parseDividerLine,
} from './nano-markdown-divider'

export function parseSetextHeading(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
  isMarkdownBlockLine: (line: string) => boolean,
  isFencedCodeLine: (line: string) => boolean,
  isQuoteLine: (line: string) => boolean,
): { block: NanoBlock; nextIndex: number } | null {
  const line = lines[index]!
  const marker = setextHeadingMarker(lines[index + 1] ?? '')
  if (!marker || line.trim() === '' || isFencedCodeLine(line) || isQuoteLine(line) || isMarkdownBlockLine(line)) return null

  return {
    block: textBlock('heading', line, state, {
      level: marker.marker === '=' ? 1 : 2,
      headingStyle: 'setext',
      setextMarker: marker.marker,
      setextLength: marker.length,
    }),
    nextIndex: index + 2,
  }
}

export function parseAtxHeadingLine(line: string, state: MarkdownParseState): NanoBlock | null {
  const heading = atxHeading(line)
  return heading ? textBlock('heading', heading.text, state, heading.attrs) : null
}

export function markdownHeading(block: Extract<NanoBlock, { type: 'heading' }>): string {
  if (block.headingStyle === 'setext' && block.level <= 2) {
    const text = inlineMarkdown(block.text, block.marks)
    return `${text}\n${setextMarker(block.setextMarker, block.level).repeat(setextLength(block.setextLength))}`
  }

  const marker = '#'.repeat(block.level)
  const text = inlineMarkdown(block.text, block.marks)
  const textSpacing = text ? ' '.repeat(atxSpacing(block.atxTextSpacing)) : ''
  const closing = block.atxClosingLength
    ? `${' '.repeat(atxSpacing(block.atxClosingSpacing))}${'#'.repeat(atxClosingLength(block.atxClosingLength))}`
    : ''
  return text ? `${marker}${textSpacing}${text}${closing}` : marker
}

function setextHeadingMarker(line: string): { marker: SetextMarker; length: number } | null {
  const match = /^[ \t]*(=+|-+)[ \t]*$/.exec(line)
  if (!match) return null

  const marker = match[1]![0] === '=' ? '=' : '-'
  return { marker, length: match[1]!.length }
}

function atxHeading(line: string): { text: string; attrs: { level: number; atxClosingLength?: number; atxClosingSpacing?: number; atxTextSpacing?: number } } | null {
  const match = /^(#{1,6})([ \t]*)(.*?)[ \t]*$/.exec(line)
  if (!match) return null

  const level = match[1]!.length
  const textSpacing = match[2]!.length
  const rawText = match[3] ?? ''
  if (rawText && textSpacing === 0) return null

  const openingAttrs = textSpacing > 1 ? { atxTextSpacing: textSpacing } : {}
  const closing = /^(.*?)([ \t]+)(#+)$/.exec(rawText)
  if (!closing) return { text: rawText, attrs: { level, ...openingAttrs } }

  const closingSpacing = closing[2]!.length

  return {
    text: closing[1] ?? '',
    attrs: {
      level,
      ...openingAttrs,
      atxClosingLength: atxClosingLength(closing[3]!.length),
      atxClosingSpacing: atxSpacing(closingSpacing),
    },
  }
}
