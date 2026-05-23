import type { BlockTemplate } from './assembly/capability'
import { footnoteDefinition, footnoteName } from './nano-footnote'
import { noteLinkParts } from './nano-note-link'
import { tagNameFromToken } from './nano-tag'
import { externalUrlTokenAt } from './nano-url'
import { defaultImageSrc } from './nano-block-option-values'

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
    target: parts?.target ?? 'Today',
    ...(parts?.alias ? { alias: parts.alias } : {}),
  }
}

export function tagRefTemplate(source: string): BlockTemplate {
  return {
    type: 'tag_ref',
    name: tagNameFromToken(source) ?? 'projects/editor',
  }
}

export function bookmarkTemplate(source: string): BlockTemplate {
  const token = externalUrlTokenAt(source.trim(), 0)
  return {
    type: 'bookmark',
    href: token?.href ?? 'https://bear.app',
    syntax: token?.syntax ?? 'bare',
  }
}

export function markdownBookmarkTemplate(match: RegExpExecArray): BlockTemplate {
  const destination = markdownTemplateDestination(match[2] ?? 'https://bear.app')
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
  const destination = markdownTemplateDestination(match[2] ?? 'files/brief.pdf')
  return {
    type: 'attachment',
    src: destination.href,
    label: unescapeMarkdownLinkText(match[1] ?? ''),
    ...(match[3] ? { title: unescapeMarkdownLinkTitle(match[3]) } : {}),
    ...(destination.destinationStyle ? { destinationStyle: destination.destinationStyle } : {}),
  }
}

export function markdownImageTemplate(match: RegExpExecArray): BlockTemplate {
  const destination = markdownTemplateDestination(match[2] ?? defaultImageSrc)
  return {
    type: 'image',
    src: destination.href,
    alt: unescapeMarkdownLinkText(match[1] ?? ''),
    ...(match[3] ? { title: unescapeMarkdownLinkTitle(match[3]) } : {}),
    ...(destination.destinationStyle ? { destinationStyle: destination.destinationStyle } : {}),
  }
}

export { footnoteName }

function markdownTemplateDestination(source: string): { href: string; destinationStyle?: 'angle' } {
  const trimmed = source.trim()
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    const href = unescapeMarkdownLinkDestination(trimmed.slice(1, -1))
    return {
      href,
      ...(!needsAngleMarkdownDestination(href) ? { destinationStyle: 'angle' as const } : {}),
    }
  }

  return { href: unescapeMarkdownLinkDestination(trimmed) }
}

function unescapeMarkdownLinkDestination(source: string): string {
  return source.replace(/\\([\\>])/g, '$1')
}

function needsAngleMarkdownDestination(href: string): boolean {
  return href === '' || /[\s<>]/.test(href) || !hasBalancedParentheses(href)
}

function hasBalancedParentheses(source: string): boolean {
  let depth = 0
  for (const char of source) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

function unescapeMarkdownLinkText(source: string): string {
  return source.replace(/\\([\\[\]])/g, '$1')
}

function unescapeMarkdownLinkTitle(source: string): string {
  return source.replace(/\\([\\"])/g, '$1')
}
