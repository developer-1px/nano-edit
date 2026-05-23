import type { NanoBlock } from './nano-core'
import {
  clampIndent,
  markdownOrderedStart,
} from './nano-markdown-block-attrs'

export function nextOrderedListIndex(block: NanoBlock, orderedListIndexes: number[]): number {
  if (block.type === 'list_item' && block.kind === 'ordered') {
    const indent = blockIndent(block)
    const explicitStart = orderedListStart(block)
    orderedListIndexes[indent] = explicitStart ?? ((orderedListIndexes[indent] ?? 0) + 1)
    orderedListIndexes.length = indent + 1
    return orderedListIndexes[indent]!
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

export function isListLikeBlock(block: NanoBlock): block is Extract<NanoBlock, { type: 'todo' | 'list_item' }> {
  return block.type === 'todo' || block.type === 'list_item'
}

function blockIndent(block: Extract<NanoBlock, { type: 'todo' | 'list_item' }>): number {
  return clampIndent(block.indent)
}

function orderedListStart(block: Extract<NanoBlock, { type: 'list_item' }>): number | null {
  return block.kind === 'ordered' ? markdownOrderedStart(block.start) : null
}
