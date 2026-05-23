import type { NanoBlock } from './nano-core'
import { markdownAttachmentCodec } from './nano-markdown-attachment'
import { markdownBookmarkCodec } from './nano-markdown-bookmark'
import type { MarkdownAtomicBlock } from './nano-markdown-atomic-types'
import { markdownNoteRefCodec } from './nano-markdown-note-ref'
import { markdownTagRefCodec } from './nano-markdown-tag-ref'

export {
  markdownImage,
  parseMarkdownImage,
} from './nano-markdown-image'
export type { WithoutId } from './nano-markdown-atomic-types'

const markdownAtomicBlockCodecs = [
  markdownBookmarkCodec,
  markdownNoteRefCodec,
  markdownTagRefCodec,
  markdownAttachmentCodec,
] as const

export function parseMarkdownAtomicBlock(markdown: string): Omit<MarkdownAtomicBlock, 'id'> | null {
  for (const codec of markdownAtomicBlockCodecs) {
    const block = codec.parse(markdown)
    if (block) return block
  }
  return null
}

export function markdownAtomicBlock(block: NanoBlock): string | null {
  if (!isMarkdownAtomicBlock(block)) return null

  const codec = markdownAtomicBlockCodecs.find((candidate) => candidate.type === block.type)
  return codec
    ? (codec.markdown as (block: MarkdownAtomicBlock) => string)(block)
    : null
}

function isMarkdownAtomicBlock(block: NanoBlock): block is MarkdownAtomicBlock {
  return markdownAtomicBlockCodecs.some((codec) => codec.type === block.type)
}
