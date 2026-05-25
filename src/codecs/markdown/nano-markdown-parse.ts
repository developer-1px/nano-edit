import { NanoDocumentSchema, type NanoBlock, type NanoDocument } from '../../core/nano-core'
import { textBlock } from './nano-markdown-text-block'
import type { MarkdownParseState } from './nano-markdown-types'
import {
  isFencedCodeLine,
  parseFencedCode,
  parseMathBlock,
} from './nano-markdown-math-code'
import {
  isQuoteLine,
  parseCallout,
  parseQuote,
} from './nano-markdown-quote-callout'
import { parseSetextHeading } from './nano-markdown-heading-divider'
import { parseFootnoteBlock } from './nano-markdown-footnote'
import { parseListBlock } from './nano-markdown-list'
import { parseTable } from './nano-markdown-table'
import {
  isMarkdownBlockLine,
  parseMarkdownLine,
} from './nano-markdown-line'

export function nanoDocumentFromMarkdown(markdown: string): NanoDocument {
  const state: MarkdownParseState = { nextId: 1 }
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: NanoBlock[] = []
  let index = 0

  while (index < lines.length) {
    if (lines[index]!.trim() === '') {
      index += 1
      continue
    }

    const parsed = parseStructuredBlock(lines, index, state)
    if (parsed) {
      blocks.push(parsed.block)
      index = parsed.nextIndex
      continue
    }

    const block = parseMarkdownLine(lines[index]!, state)
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

function parseParagraphLines(lines: readonly string[], index: number): { lines: string[]; nextIndex: number } {
  const paragraphLines: string[] = []
  let nextIndex = index
  while (nextIndex < lines.length && lines[nextIndex]!.trim() !== '') {
    if (isFencedCodeLine(lines[nextIndex]!) || isQuoteLine(lines[nextIndex]!) || isMarkdownBlockLine(lines[nextIndex]!)) break
    paragraphLines.push(lines[nextIndex]!)
    nextIndex += 1
  }
  return { lines: paragraphLines, nextIndex }
}
