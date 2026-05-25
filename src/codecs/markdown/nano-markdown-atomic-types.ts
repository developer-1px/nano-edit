import type { NanoBlock } from '../../core/nano-core'

export type MarkdownAtomicBlock = Extract<NanoBlock, { type: 'bookmark' | 'note_ref' | 'tag_ref' | 'attachment' }>
export type WithoutId<T> = T extends { id: string } ? Omit<T, 'id'> : never

export interface MarkdownAtomicBlockCodec<TType extends MarkdownAtomicBlock['type']> {
  type: TType
  parse: (markdown: string) => WithoutId<Extract<MarkdownAtomicBlock, { type: TType }>> | null
  markdown: (block: Extract<MarkdownAtomicBlock, { type: TType }>) => string
}

export function defineMarkdownAtomicBlockCodec<TType extends MarkdownAtomicBlock['type']>(
  codec: MarkdownAtomicBlockCodec<TType>,
): MarkdownAtomicBlockCodec<TType> {
  return codec
}
