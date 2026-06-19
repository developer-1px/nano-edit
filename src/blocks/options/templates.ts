import type { BlockTemplate } from '../../assembly/capability'
import { footnoteDefinition } from '../../entities/reference/nano-footnote'
import { noteLinkParts } from '../../entities/reference/nano-note-link'
import { tagNameFromToken } from '../../entities/reference/nano-tag'
import { externalUrlTokenAt } from '../../entities/reference/nano-url'
import { needsAngleMarkdownDestination } from '../../codecs/markdown/link/escape'

export function footnoteTemplate(source: string): BlockTemplate {
  const footnote = footnoteDefinition(source)
  return {
    type: 'footnote',
    footnoteTextSpacing: footnote?.textSpacing,
    name: footnote?.name ?? '1',
    text: footnote?.text ?? '',
  }
}

export function noteRefTemplate(source: string): BlockTemplate {
  const parts = noteLinkParts(source)
  return {
    type: 'note_ref',
    target: parts?.target ?? '',
    ...(parts?.alias ? { alias: parts.alias } : {}),
  }
}

export function tagRefTemplate(source: string): BlockTemplate {
  return {
    type: 'tag_ref',
    name: tagNameFromToken(source) ?? '',
  }
}

export function bookmarkTemplate(source: string): BlockTemplate {
  const token = externalUrlTokenAt(source.trim(), 0)
  return {
    type: 'bookmark',
    href: token?.href ?? '',
    syntax: token?.syntax ?? 'bare',
  }
}

export function markdownBookmarkTemplate(match: RegExpExecArray): BlockTemplate {
  const destination = markdownTemplateDestination(match[2] ?? '')
  return {
    type: 'bookmark',
    href: destination.href,
    label: unescapeMarkdownLinkText(match[1] ?? ''),
    ...(match[3] ? { title: unescapeMarkdownLinkTitle(match[3]) } : {}),
    ...(destination.destinationStyle ? { destinationStyle: destination.destinationStyle } : {}),
    syntax: 'markdown',
  }
}

export function markdownAttachmentTemplate(match: RegExpExecArray): BlockTemplate {
  const destination = markdownTemplateDestination(match[2] ?? '')
  return {
    type: 'attachment',
    src: destination.href,
    label: unescapeMarkdownLinkText(match[1] ?? ''),
    ...(match[3] ? { title: unescapeMarkdownLinkTitle(match[3]) } : {}),
    ...(destination.destinationStyle ? { destinationStyle: destination.destinationStyle } : {}),
  }
}

export function markdownImageTemplate(match: RegExpExecArray): BlockTemplate {
  const destination = markdownTemplateDestination(match[2] ?? '')
  return {
    type: 'image',
    src: destination.href,
    alt: unescapeMarkdownLinkText(match[1] ?? ''),
    ...(match[3] ? { title: unescapeMarkdownLinkTitle(match[3]) } : {}),
    ...(destination.destinationStyle ? { destinationStyle: destination.destinationStyle } : {}),
  }
}

function markdownTemplateDestination(source: string): { href: string; destinationStyle?: 'angle' } {
  const trimmed = source.trim()
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    const href = unescapeMarkdownLinkDestination(trimmed.slice(1, -1))
    const destination: { href: string; destinationStyle?: 'angle' } = { href }
    if (!needsAngleMarkdownDestination(href)) destination.destinationStyle = 'angle'
    return destination
  }

  return { href: unescapeMarkdownLinkDestination(trimmed) }
}

function unescapeMarkdownLinkDestination(source: string): string {
  return source.replace(/\\([\\>])/g, '$1')
}

function unescapeMarkdownLinkText(source: string): string {
  return source.replace(/\\([\\[\]])/g, '$1')
}

function unescapeMarkdownLinkTitle(source: string): string {
  return source.replace(/\\([\\"])/g, '$1')
}
