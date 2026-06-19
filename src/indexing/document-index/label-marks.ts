import type { NanoBlock, NanoMark } from '../../entities/document/nano-document-model'

export function blockMarks(block: NanoBlock): readonly NanoMark[] {
  return 'marks' in block && Array.isArray(block.marks) ? block.marks : []
}

export function markedText(block: NanoBlock, mark: NanoMark): string {
  return 'text' in block && typeof block.text === 'string' ? block.text.slice(mark.from, mark.to) : ''
}
