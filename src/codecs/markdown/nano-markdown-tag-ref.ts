import type { NanoBlock } from '../../core/nano-core'
import {
  defineMarkdownAtomicBlockCodec,
  type WithoutId,
} from './nano-markdown-atomic-types'
import { tagLabel, tagTokenAt } from '../../core/nano-tag'

type TagRefBlock = Extract<NanoBlock, { type: 'tag_ref' }>

export const markdownTagRefCodec = defineMarkdownAtomicBlockCodec({
  type: 'tag_ref',
  parse: parseMarkdownTagRef,
  markdown: markdownTagRef,
})

function parseMarkdownTagRef(markdown: string): WithoutId<TagRefBlock> | null {
  const tag = tagTokenAt(markdown, 0)
  return tag && tag.to === markdown.length ? { type: 'tag_ref', name: tag.name } : null
}

function markdownTagRef(block: TagRefBlock): string {
  return tagLabel(block.name) ?? `#${block.name}`
}
