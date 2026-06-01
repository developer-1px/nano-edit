import { NanoDocumentSchema, type NanoBlock, type NanoDocument } from '../../core/nano-core'
import { markdownTodoBlock } from '../../capabilities/todo/markdown'
import { inlineMarkdown } from './nano-markdown-inline-serialize'
import { markdownTable } from './nano-markdown-table'
import {
  markdownAtomicBlock,
  markdownImage,
} from './nano-markdown-atomic'
import {
  fencedCode,
  mathBlock,
} from './nano-markdown-math-code'
import {
  markdownCallout,
  markdownQuote,
} from './nano-markdown-quote-callout'
import {
  dividerMarkdown,
  markdownHeading,
} from './nano-markdown-heading-divider'
import { markdownFootnote } from './nano-markdown-footnote'
import {
  isListLikeBlock,
  listContinuationDefaultIndent,
  listContinuationIndent,
  markdownListIndent,
  markdownListItem,
  nextOrderedListIndex,
} from './nano-markdown-list'

import type { NanoMarkdownBlockEntry } from './types'

export type { NanoMarkdownBlockEntry }

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
      return markdownCallout(block.tone, inlineMarkdown(block.text, block.marks), block.calloutMarkerSpacing, block.calloutMarkerDepths, block.calloutTextSpacing)
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
      return ''
  }
}

function markdownBlockSeparator(previous: NanoBlock, next: NanoBlock): string {
  if (isListLikeBlock(previous) && isListLikeBlock(next)) return '\n'
  return '\n\n'
}
