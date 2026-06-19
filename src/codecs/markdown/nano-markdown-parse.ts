import { NanoDocumentSchema, type NanoBlock, type NanoDocument } from '../../entities/document/nano-document-model'
import { blockMathFormula } from '../../entities/math/nano-math'
import { parseMarkdownAtomicBlock } from './nano-markdown-atomic'
import { textBlock } from './nano-markdown-text-block'
import type {
  DividerMarker,
  MarkdownParseState,
} from './nano-markdown-types'
import {
  isFencedCodeLine,
  parseFencedCode,
} from './nano-markdown-code-parse'
import { parseMarkdownImage } from './nano-markdown-image'
import { markdownListLine } from './nano-markdown-list-line'
import { isQuoteLine } from './nano-markdown-quote-lines'
import {
  parseCallout,
  parseQuote,
} from './nano-markdown-quote-callout'
import {
  parseAtxHeadingLine,
  parseSetextHeading,
} from './nano-markdown-heading'
import {
  parseFootnoteBlock,
  parseFootnoteLine,
} from './nano-markdown-footnote'
import { parseListBlock } from './nano-markdown-list-parse'
import { nextMarkdownBlockId } from './nano-markdown-state'
import { parseTable } from './nano-markdown-table-parse'

export interface NanoTextBlockFromMarkdownOptions {
  fallbackText?: string
  id?: string
}

export function nanoDocumentFromMarkdown(markdown: string): NanoDocument {
  const state: MarkdownParseState = { nextId: 1 }
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: NanoBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (line.trim() === '') {
      index += 1
      continue
    }

    const parsed = parseStructuredBlock(lines, index, state)
    if (parsed) {
      blocks.push(parsed.block)
      index = parsed.nextIndex
      continue
    }

    const block = parseMarkdownLine(line, state)
    if (block) {
      blocks.push(block)
      index += 1
      continue
    }

    const paragraph = parseParagraphLines(lines, index)
    blocks.push(textBlock('paragraph', paragraph.lines.join('\n'), state))
    index = paragraph.nextIndex
  }

  return NanoDocumentSchema.parse({
    blocks: blocks.length > 0 ? blocks : [textBlock('paragraph', '', state)],
  })
}

export function nanoTextBlockFromMarkdown(
  markdown: string,
  options: NanoTextBlockFromMarkdownOptions = {},
): NanoBlock | null {
  const trimmed = markdown.trim()
  const fallbackText = options.fallbackText ?? ' '
  const document = nanoDocumentFromMarkdown(trimmed !== '' ? trimmed : fallbackText)
  const block = document.blocks.find((candidate) => 'text' in candidate) ?? null
  if (!block) return null
  return options.id ? { ...block, id: options.id } : block
}

function parseStructuredBlock(lines: readonly string[], index: number, state: MarkdownParseState) {
  return parseMathBlock(lines, index, state)
    ?? parseFencedCode(lines, index, state)
    ?? parseTable(lines, index, state)
    ?? parseCallout(lines, index, state)
    ?? parseQuote(lines, index, state)
    ?? parseSetextHeading(lines, index, state, isMarkdownBlockLine, isFencedCodeLine, isQuoteLine)
    ?? parseFootnoteBlock(lines, index, state)
    ?? parseListBlock(lines, index, state)
}

function parseMathBlock(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const line = (lines[index] ?? '').trim()
  const singleLine = /^\$\$(.+)\$\$$/.exec(line)
  if (singleLine) {
    return {
      block: {
        id: nextMarkdownBlockId(state),
        type: 'math',
        text: blockMathFormula(singleLine[1] ?? ''),
        mathStyle: 'single',
      },
      nextIndex: index + 1,
    }
  }

  if (line !== '$$') return null

  const content: string[] = []
  let nextIndex = index + 1
  while (nextIndex < lines.length) {
    const line = lines[nextIndex] ?? ''
    if (line.trim() === '$$') {
      nextIndex += 1
      break
    }
    content.push(line)
    nextIndex += 1
  }

  return {
    block: {
      id: nextMarkdownBlockId(state),
      type: 'math',
      text: blockMathFormula(content.join('\n')),
    },
    nextIndex,
  }
}

function parseParagraphLines(lines: readonly string[], index: number): { lines: string[]; nextIndex: number } {
  const paragraphLines: string[] = []
  let nextIndex = index
  while (nextIndex < lines.length) {
    const line = lines[nextIndex] ?? ''
    if (line.trim() === '') break
    if (isFencedCodeLine(line) || isQuoteLine(line) || isMarkdownBlockLine(line)) break
    paragraphLines.push(line)
    nextIndex += 1
  }
  return { lines: paragraphLines, nextIndex }
}

function parseMarkdownLine(line: string, state: MarkdownParseState): NanoBlock | null {
  const trimmed = line.trim()
  const image = parseMarkdownImage(trimmed)
  if (image) {
    return {
      id: nextMarkdownBlockId(state),
      type: 'image',
      src: image.src,
      ...(image.alt ? { alt: image.alt } : {}),
      ...(image.destinationStyle ? { destinationStyle: image.destinationStyle } : {}),
      ...(image.title ? { title: image.title } : {}),
    }
  }

  const atomic = parseMarkdownAtomicBlock(trimmed)
  if (atomic) return { id: nextMarkdownBlockId(state), ...atomic }

  const divider = parseDividerLine(trimmed, state)
  if (divider) return divider

  const heading = parseAtxHeadingLine(line, state)
  if (heading) return heading

  const footnote = parseFootnoteLine(line, state)
  if (footnote) return footnote

  const list = markdownListLine(line)
  if (list) {
    return textBlock(list.type, list.text, state, list.attrs)
  }

  return null
}

function isMarkdownBlockLine(line: string): boolean {
  return parseMarkdownImage(line.trim()) !== null
    || isMathBlockLine(line)
    || parseMarkdownAtomicBlock(line.trim()) !== null
    || /^(#{1,6})(?:\s+|$)/.test(line)
    || /^\[\^[^\]\s\r\n]+\]:/.test(line)
    || /^[ \t]*[-*+]\s+\[[ xX]\](?:\s+|$)/.test(line)
    || /^[ \t]*[-*+](?:\s+|$)/.test(line)
    || /^[ \t]*\d+[.)](?:\s+|$)/.test(line)
    || /^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())
}

function isMathBlockLine(line: string): boolean {
  return /^\$\$(?:.*\$\$)?$/.test(line.trim())
}

function parseDividerLine(trimmed: string, state: MarkdownParseState): NanoBlock | null {
  const divider = dividerMarkerOrNull(trimmed)
  if (!divider) return null

  return {
    id: nextMarkdownBlockId(state),
    type: 'divider',
    ...(divider.marker !== '---' ? { marker: divider.marker } : {}),
    ...(divider.length !== 3 ? { markerLength: divider.length } : {}),
  }
}

function dividerMarkerOrNull(marker: string): { marker: DividerMarker; length: number } | null {
  if (/^-{3,}$/.test(marker)) return { marker: '---', length: marker.length }
  if (/^\*{3,}$/.test(marker)) return { marker: '***', length: marker.length }
  if (/^_{3,}$/.test(marker)) return { marker: '___', length: marker.length }
  return null
}
