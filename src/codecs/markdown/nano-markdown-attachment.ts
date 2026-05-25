import type { NanoBlock } from '../../core/nano-core'
import {
  defineMarkdownAtomicBlockCodec,
  type WithoutId,
} from './nano-markdown-atomic-types'
import { isBookmarkHref } from './nano-markdown-bookmark'
import {
  escapeMarkdownImageText,
  markdownLinkAt,
  markdownLinkClose,
  unescapeMarkdownImageText,
} from './nano-markdown-link'

type AttachmentBlock = Extract<NanoBlock, { type: 'attachment' }>

export const markdownAttachmentCodec = defineMarkdownAtomicBlockCodec({
  type: 'attachment',
  parse: parseMarkdownAttachmentBlock,
  markdown: markdownAttachment,
})

function parseMarkdownAttachmentBlock(markdown: string): WithoutId<AttachmentBlock> | null {
  const link = markdownLinkAt(markdown, 0)
  if (!link || link.to !== markdown.length || !isAttachmentHref(link.href)) return null

  return {
    type: 'attachment',
    src: link.href,
    label: unescapeMarkdownImageText(link.label),
    ...(link.title ? { title: link.title } : {}),
    ...(link.destinationStyle ? { destinationStyle: link.destinationStyle } : {}),
  }
}

function markdownAttachment(block: AttachmentBlock): string {
  const label = escapeMarkdownImageText(block.label ?? attachmentLabel(block.src))
  return `[${label}${markdownLinkClose(block.src, block.title, block.destinationStyle)}`
}

function isAttachmentHref(href: string): boolean {
  if (!href || isBookmarkHref(href) || href.startsWith('#')) return false
  if (/^file:/i.test(href)) return true
  return /(?:^|[/\\])[^/\\?#]+\.[A-Za-z0-9]{1,12}(?:[?#].*)?$/.test(href)
}

function attachmentLabel(src: string): string {
  const clean = src.replace(/[?#].*$/, '').replace(/[/\\]+$/, '')
  return clean.split(/[/\\]/).filter(Boolean).at(-1) ?? src
}
