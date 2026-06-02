import type { NanoBlock } from '../../core/nano-core'
import {
  defineMarkdownAtomicBlockCodec,
  type WithoutId,
} from './nano-markdown-atomic-types'
import {
  escapeMarkdownImageText,
  markdownLinkAt,
  markdownLinkClose,
} from './link/index'
import { externalUrlTokenAt } from '../../core/nano-url'

type BookmarkBlock = Extract<NanoBlock, { type: 'bookmark' }>

export const markdownBookmarkCodec = defineMarkdownAtomicBlockCodec({
  type: 'bookmark',
  parse: parseMarkdownBookmarkBlock,
  markdown: markdownBookmark,
})

function parseMarkdownBookmarkBlock(markdown: string): WithoutId<BookmarkBlock> | null {
  const link = markdownLinkAt(markdown, 0)
  if (link && link.to === markdown.length && isBookmarkHref(link.href)) {
    return {
      type: 'bookmark',
      href: link.href,
      label: link.label,
      ...(link.title ? { title: link.title } : {}),
      ...(link.destinationStyle ? { destinationStyle: link.destinationStyle } : {}),
      syntax: 'markdown',
    }
  }

  const token = externalUrlTokenAt(markdown, 0)
  if (!token || token.to !== markdown.length) return null

  return {
    type: 'bookmark',
    href: token.href,
    ...(token.syntax !== 'bare' ? { syntax: token.syntax } : {}),
  }
}

function markdownBookmark(block: BookmarkBlock): string {
  if (block.syntax === 'markdown') {
    const label = escapeMarkdownImageText(block.label ?? block.href)
    return `[${label}${markdownLinkClose(block.href, block.title, block.destinationStyle)}`
  }

  return block.syntax === 'autolink' ? `<${block.href}>` : block.href
}

export function isBookmarkHref(href: string): boolean {
  return /^(?:https?:\/\/|mailto:)/i.test(href)
}
