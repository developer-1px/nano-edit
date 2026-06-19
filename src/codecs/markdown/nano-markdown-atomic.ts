import type { NanoBlock } from '../../entities/document/nano-document-model'
import {
  externalUrlTokenAt,
  hrefFileName,
} from '../../entities/reference/nano-url'
import { tagLabel, tagTokenAt } from '../../entities/reference/nano-tag'
import {
  markdownLinkAt,
  markdownNoteLinkAt,
} from './link/parse'
import {
  escapeMarkdownImageText,
  markdownLinkClose,
  unescapeMarkdownImageText,
} from './link/serialize'

type MarkdownAtomicBlock = Extract<NanoBlock, { type: 'bookmark' | 'note_ref' | 'tag_ref' | 'attachment' }>
type WithoutId<T> = T extends { id: string } ? Omit<T, 'id'> : never

interface MarkdownAtomicBlockCodec<TType extends MarkdownAtomicBlock['type']> {
  type: TType
  parse: (markdown: string) => WithoutId<Extract<MarkdownAtomicBlock, { type: TType }>> | null
}

type BookmarkBlock = Extract<NanoBlock, { type: 'bookmark' }>
type NoteRefBlock = Extract<NanoBlock, { type: 'note_ref' }>
type TagRefBlock = Extract<NanoBlock, { type: 'tag_ref' }>
type AttachmentBlock = Extract<NanoBlock, { type: 'attachment' }>

function defineMarkdownAtomicBlockCodec<TType extends MarkdownAtomicBlock['type']>(
  codec: MarkdownAtomicBlockCodec<TType>,
): MarkdownAtomicBlockCodec<TType> {
  return codec
}

const markdownBookmarkCodec = defineMarkdownAtomicBlockCodec({
  type: 'bookmark',
  parse: parseMarkdownBookmarkBlock,
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

function isBookmarkHref(href: string): boolean {
  return /^(?:https?:\/\/|mailto:)/i.test(href)
}

const markdownNoteRefCodec = defineMarkdownAtomicBlockCodec({
  type: 'note_ref',
  parse: parseMarkdownNoteRef,
})

function parseMarkdownNoteRef(markdown: string): WithoutId<NoteRefBlock> | null {
  const noteLink = markdownNoteLinkAt(markdown, 0)
  if (!noteLink || noteLink.to !== markdown.length) return null

  return {
    type: 'note_ref',
    target: noteLink.target,
    ...(noteLink.alias ? { alias: noteLink.alias } : {}),
  }
}

function markdownNoteRef(block: NoteRefBlock): string {
  return block.alias ? `[[${block.target}|${block.alias}]]` : `[[${block.target}]]`
}

const markdownTagRefCodec = defineMarkdownAtomicBlockCodec({
  type: 'tag_ref',
  parse: parseMarkdownTagRef,
})

function parseMarkdownTagRef(markdown: string): WithoutId<TagRefBlock> | null {
  const tag = tagTokenAt(markdown, 0)
  return tag && tag.to === markdown.length ? { type: 'tag_ref', name: tag.name } : null
}

function markdownTagRef(block: TagRefBlock): string {
  return tagLabel(block.name) ?? `#${block.name}`
}

const markdownAttachmentCodec = defineMarkdownAtomicBlockCodec({
  type: 'attachment',
  parse: parseMarkdownAttachmentBlock,
})

const markdownAtomicBlockCodecs = [
  markdownBookmarkCodec,
  markdownNoteRefCodec,
  markdownTagRefCodec,
  markdownAttachmentCodec,
] as const

export function parseMarkdownAtomicBlock(markdown: string): WithoutId<MarkdownAtomicBlock> | null {
  for (const codec of markdownAtomicBlockCodecs) {
    const block = codec.parse(markdown)
    if (block) return block
  }
  return null
}

export function markdownAtomicBlock(block: NanoBlock): string | null {
  switch (block.type) {
    case 'bookmark':
      return markdownBookmark(block)
    case 'note_ref':
      return markdownNoteRef(block)
    case 'tag_ref':
      return markdownTagRef(block)
    case 'attachment':
      return markdownAttachment(block)
    default:
      return null
  }
}

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
  const label = escapeMarkdownImageText(block.label ?? hrefFileName(block.src))
  return `[${label}${markdownLinkClose(block.src, block.title, block.destinationStyle)}`
}

function isAttachmentHref(href: string): boolean {
  if (!href || isBookmarkHref(href) || href.startsWith('#')) return false
  if (/^file:/i.test(href)) return true
  return /(?:^|[/\\])[^/\\?#]+\.[A-Za-z0-9]{1,12}(?:[?#].*)?$/.test(href)
}
