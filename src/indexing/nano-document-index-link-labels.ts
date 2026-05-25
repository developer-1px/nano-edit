import type { NanoBlock, NanoMark } from '../core/nano-core'
import { noteLinkNavigationTarget } from '../core/nano-note-link'

export function attachmentIndexLabel(block: Extract<NanoBlock, { type: 'attachment' }>): string {
  return block.label ?? attachmentFileName(block.src)
}

export function noteTargetFromLabel(label: string): string | null {
  const target = noteLinkNavigationTarget(label)
  return target || null
}

export function normalizeNoteTarget(target: string): string {
  return noteLinkNavigationTarget(target).toLowerCase()
}

export function externalLinkLabel(label: string, mark: Extract<NanoMark, { type: 'link' }>): string {
  return mark.syntax === 'autolink' ? mark.href : label || mark.href
}

export function bookmarkIndexLabel(block: Extract<NanoBlock, { type: 'bookmark' }>): string {
  return block.label ?? bookmarkHostLabel(block.href)
}

export function markdownLinkLabel(label: string, href: string, title: string | undefined, destinationStyle?: 'angle'): string {
  const destination = markdownLinkDestinationSource(href, destinationStyle)
  return typeof title === 'string' && title
    ? `[${label}](${destination} "${title.replace(/([\\"])/g, '\\$1')}")`
    : `[${label}](${destination})`
}

function attachmentFileName(src: string): string {
  const clean = src.replace(/[?#].*$/, '').replace(/[/\\]+$/, '')
  return clean.split(/[/\\]/).filter(Boolean).at(-1) ?? src
}

function bookmarkHostLabel(href: string): string {
  try {
    const url = new URL(href)
    return url.protocol === 'mailto:' ? href.replace(/^mailto:/i, '') : url.hostname || href
  } catch {
    return href.replace(/^https?:\/\//i, '').replace(/^mailto:/i, '')
  }
}

function markdownLinkDestinationSource(href: string, destinationStyle?: 'angle'): string {
  return destinationStyle === 'angle' || needsAngleMarkdownDestination(href)
    ? `<${href.replace(/([\\>])/g, '\\$1')}>`
    : href
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
