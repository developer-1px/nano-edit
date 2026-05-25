import type { NanoBlock } from '../../core/nano-core'
import {
  bulletMarker,
  clampIndent,
  indentText,
  listContinuationDefaultIndent,
  listContinuationIndent,
  orderedMarker,
  orderedStartText,
} from './nano-markdown-block-attrs'
import { inlineMarkdown } from './nano-markdown-inline-serialize'

export function markdownListItem(block: Extract<NanoBlock, { type: 'list_item' }>, orderedListIndex: number): string {
  const marker = `${markdownListIndent(block)}${block.kind === 'ordered' ? `${orderedListIndexText(block, orderedListIndex)}${orderedMarker(block.orderedMarker)}` : bulletMarker(block.marker)}`
  const continuationIndent = listContinuationDefaultIndent(marker)
  const lines = inlineMarkdown(block.text, block.marks).split('\n')
  const firstLine = lines[0] ?? ''
  return [
    firstLine ? `${marker} ${firstLine}` : marker,
    ...lines.slice(1).map((line, index) => `${listContinuationIndent(block.continuationIndents?.[index], continuationIndent)}${line}`),
  ].join('\n')
}

export function markdownListIndent(block: Extract<NanoBlock, { type: 'todo' | 'list_item' }>): string {
  return indentText(block.indentText) ?? '  '.repeat(blockIndent(block))
}

function blockIndent(block: Extract<NanoBlock, { type: 'todo' | 'list_item' }>): number {
  return clampIndent(block.indent)
}

function orderedListIndexText(block: Extract<NanoBlock, { type: 'list_item' }>, orderedListIndex: number): string {
  return orderedStartText(block.orderedStartText) ?? String(orderedListIndex)
}
