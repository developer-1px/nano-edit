import { NanoDocumentSchema, type NanoBlock, type NanoDocument } from '../../entities/document/nano-document-model'
import { markdownTodoBlock } from '../../capabilities/todo/markdown'
import { inlineMarkdown } from './nano-markdown-inline-serialize'
import { markdownTable } from './nano-markdown-table-serialize'
import {
  markdownAtomicBlock,
} from './nano-markdown-atomic'
import { markdownImage } from './nano-markdown-image'
import {
  codeFenceIndent,
  codeFenceInfo,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
  longestFenceMarkerRun,
} from './nano-markdown-code-utils'
import {
  calloutTextSpacingValue,
  quoteMarkerDepth,
  quoteMarkerSpacingValue,
} from './nano-markdown-quote-attrs'
import { markdownHeading } from './nano-markdown-heading'
import {
  bulletMarker,
  dividerMarkdown,
  orderedMarker,
} from './nano-markdown-marker-attrs'
import { markdownFootnote } from './nano-markdown-footnote'
import {
  clampIndent,
  indentText,
  listContinuationDefaultIndent,
  listContinuationIndent,
  markdownOrderedStart,
  orderedStartText,
} from './nano-markdown-list-attrs'
import type {
  CalloutTone,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
} from './nano-markdown-types'

export interface NanoMarkdownBlockEntry {
  blockId: string
  markdown: string
}

export function nanoMarkdownFromDocument(document: NanoDocument): string {
  const validDocument = NanoDocumentSchema.parse(document)
  let markdown = ''
  let previousBlock: NanoBlock | null = null
  const orderedListIndexes: number[] = []

  for (const block of validDocument.blocks) {
    if (previousBlock) markdown += markdownBlockSeparator(previousBlock, block)
    const orderedListIndex = nextOrderedListIndex(block, orderedListIndexes)
    markdown += markdownFromBlock(block, orderedListIndex)
    previousBlock = block
  }

  return markdown
}

export function nanoMarkdownBlocksFromDocument(document: NanoDocument): NanoMarkdownBlockEntry[] {
  const validDocument = NanoDocumentSchema.parse(document)
  const orderedListIndexes: number[] = []
  return validDocument.blocks.map((block) => ({
    blockId: block.id,
    markdown: markdownFromBlock(block, nextOrderedListIndex(block, orderedListIndexes)),
  }))
}

function markdownFromBlock(block: NanoBlock, orderedListIndex = 1): string {
  const atomicMarkdown = markdownAtomicBlock(block)
  if (atomicMarkdown !== null) return atomicMarkdown

  switch (block.type) {
    case 'heading':
      return markdownHeading(block)
    case 'quote':
      return markdownQuote(block)
    case 'callout':
      return markdownCallout(
        block.tone,
        inlineMarkdown(block.text, block.marks),
        block.calloutMarkerSpacing,
        block.calloutMarkerDepths,
        block.calloutTextSpacing,
      )
    case 'todo':
      return markdownTodoBlock(block, { inlineMarkdown, listContinuationDefaultIndent, listContinuationIndent, markdownListIndent })
    case 'list_item':
      return markdownListItem(block, orderedListIndex)
    case 'footnote':
      return markdownFootnote(block)
    case 'code':
      return fencedCode(block.text, block.language, block.fenceMarker, block.fenceLength, block.fenceIndent, block.fenceInfoSpacing)
    case 'math':
      return mathBlock(block.text, block.mathStyle)
    case 'divider':
      return dividerMarkdown(block.marker, block.markerLength)
    case 'image':
      return markdownImage(block)
    case 'table':
      return markdownTable(block.rows, block.align, block.separatorCells, block.leadingPipe, block.trailingPipe, block.leadingPipes, block.trailingPipes)
    case 'paragraph':
      return inlineMarkdown(block.text, block.marks)
    default:
      return markdownCustomBlock(block)
  }
}

function markdownCustomBlock(block: NanoBlock): string {
  return 'text' in block && typeof block.text === 'string'
    ? inlineMarkdown(block.text, 'marks' in block && Array.isArray(block.marks) ? block.marks : [])
    : ''
}

function markdownCallout(
  tone: CalloutTone,
  text: string,
  markerSpacing?: readonly QuoteMarkerSpacing[],
  markerDepths?: readonly QuoteMarkerDepth[],
  textSpacing?: QuoteMarkerSpacing,
): string {
  const lines = text.split('\n')
  const first = lines[0] ?? ''
  const marker = `${quoteMarkerPrefix(markerSpacing?.[0], markerDepths?.[0])}[!${tone.toUpperCase()}]`
  const firstTextSpacing = calloutTextSpacingValue(textSpacing, first)
  return [
    first ? `${marker}${firstTextSpacing === 'space' ? ' ' : ''}${first}` : marker,
    ...lines.slice(1).map((line, index) => markdownQuoteLine(line, markerSpacing?.[index + 1], markerDepths?.[index + 1])),
  ].join('\n')
}

function markdownQuote(block: Extract<NanoBlock, { type: 'quote' }>): string {
  return inlineMarkdown(block.text, block.marks)
    .split('\n')
    .map((line, index) => markdownQuoteLine(line, block.quoteMarkerSpacing?.[index], block.quoteMarkerDepths?.[index]))
    .join('\n')
}

function markdownQuoteLine(line: string, markerSpacing: unknown, markerDepth?: unknown): string {
  const spacing = quoteMarkerSpacingValue(markerSpacing, line)
  const marker = '>'.repeat(quoteMarkerDepth(markerDepth))
  return spacing === 'space' ? `${marker} ${line}` : `${marker}${line}`
}

function quoteMarkerPrefix(markerSpacing: unknown, markerDepth?: unknown): string {
  const marker = '>'.repeat(quoteMarkerDepth(markerDepth))
  return quoteMarkerSpacingValue(markerSpacing, '') === 'space' ? `${marker} ` : marker
}

function markdownBlockSeparator(previous: NanoBlock, next: NanoBlock): string {
  if (isListLikeBlock(previous) && isListLikeBlock(next)) return '\n'
  return '\n\n'
}

function markdownListItem(block: Extract<NanoBlock, { type: 'list_item' }>, orderedListIndex: number): string {
  const marker = `${markdownListIndent(block)}${block.kind === 'ordered' ? `${orderedListIndexText(block, orderedListIndex)}${orderedMarker(block.orderedMarker)}` : bulletMarker(block.marker)}`
  const continuationIndent = listContinuationDefaultIndent(marker)
  const lines = inlineMarkdown(block.text, block.marks).split('\n')
  const firstLine = lines[0] ?? ''
  return [
    firstLine ? `${marker} ${firstLine}` : marker,
    ...lines.slice(1).map((line, index) => `${listContinuationIndent(block.continuationIndents?.[index], continuationIndent)}${line}`),
  ].join('\n')
}

function markdownListIndent(block: Extract<NanoBlock, { type: 'todo' | 'list_item' }>): string {
  return indentText(block.indentText) ?? '  '.repeat(blockIndent(block))
}

function orderedListIndexText(block: Extract<NanoBlock, { type: 'list_item' }>, orderedListIndex: number): string {
  return orderedStartText(block.orderedStartText) ?? String(orderedListIndex)
}

function nextOrderedListIndex(block: NanoBlock, orderedListIndexes: number[]): number {
  if (block.type === 'list_item' && block.kind === 'ordered') {
    const indent = blockIndent(block)
    const explicitStart = orderedListStart(block)
    orderedListIndexes[indent] = explicitStart ?? ((orderedListIndexes[indent] ?? 0) + 1)
    orderedListIndexes.length = indent + 1
    return orderedListIndexes[indent] ?? 1
  }

  if (isListLikeBlock(block)) {
    const indent = blockIndent(block)
    orderedListIndexes[indent] = 0
    orderedListIndexes.length = indent + 1
    return 1
  }

  if (orderedListIndexes.length > 0) orderedListIndexes.length = 0
  return 1
}

function isListLikeBlock(block: NanoBlock): block is Extract<NanoBlock, { type: 'todo' | 'list_item' }> {
  return block.type === 'todo' || block.type === 'list_item'
}

function blockIndent(block: Extract<NanoBlock, { type: 'todo' | 'list_item' }>): number {
  return clampIndent(block.indent)
}

function orderedListStart(block: Extract<NanoBlock, { type: 'list_item' }>): number | null {
  return block.kind === 'ordered' ? markdownOrderedStart(block.start) : null
}

function mathBlock(text: string, mathStyle?: unknown): string {
  return mathStyle === 'single' && text && !/[\r\n]/.test(text)
    ? `$$${text}$$`
    : `$$\n${text}\n$$`
}

function fencedCode(
  text: string,
  language: string | undefined,
  marker: unknown,
  length: unknown,
  indent: unknown,
  infoSpacing: unknown,
): string {
  const fenceMarker = codeFenceMarker(marker)
  const fence = fenceMarker.repeat(Math.max(codeFenceLength(length), longestFenceMarkerRun(text, fenceMarker) + 1))
  const fenceIndent = codeFenceIndent(indent)
  const info = codeFenceInfo(language) ?? ''
  const spacing = info ? codeFenceInfoSpacing(infoSpacing) : ''
  return `${fenceIndent}${fence}${spacing}${info}\n${text}\n${fenceIndent}${fence}`
}
