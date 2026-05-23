import type { NanoBlock, NanoMark } from './nano-core'

export function blockMarks(block: NanoBlock): readonly NanoMark[] {
  return 'marks' in block ? block.marks : []
}

export function markedText(block: NanoBlock, mark: NanoMark): string {
  return 'text' in block ? block.text.slice(mark.from, mark.to) : ''
}
