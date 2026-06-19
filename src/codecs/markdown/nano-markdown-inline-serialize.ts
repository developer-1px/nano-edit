import type { NanoMark } from '../../entities/document/nano-document-model'
import { tagTokenAt } from '../../entities/reference/nano-tag'
import { markdownLinkClose } from './link/serialize'
import {
  boldMarker,
  codeBacktickToken,
  italicMarker,
} from './nano-markdown-inline-utils'

interface InlineMark {
  key: string
  priority: number
  from: number
  to: number
  open: string
  close: string
  replacement?: string
  rawText?: boolean
}

export function inlineMarkdown(text: string, marks: readonly NanoMark[]): string {
  if (!text || marks.length === 0) return escapeMarkdownText(text)

  const inlineMarks = marks
    .map((mark) => inlineMark(mark, text))
    .filter((mark): mark is InlineMark => mark !== null)
    .sort((left, right) => left.priority - right.priority || left.from - right.from || right.to - left.to)
  if (inlineMarks.length === 0) return escapeMarkdownText(text)

  const boundaries = [...new Set([
    0,
    text.length,
    ...inlineMarks.flatMap((mark) => [mark.from, mark.to]),
  ])].sort((left, right) => left - right)

  let markdown = ''
  let active: InlineMark[] = []
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const from = boundaries[index] ?? 0
    const to = boundaries[index + 1] ?? text.length
    const next = inlineMarks.filter((mark) => mark.from <= from && mark.to >= to)
    markdown += transitionMarks(active, next)
    const replacement = next.find((mark) => mark.replacement)?.replacement
    markdown += replacement ?? escapeMarkdownText(
      text.slice(from, to),
      next.some((mark) => mark.key === 'code'),
      next.some((mark) => mark.rawText),
    )
    active = next
  }

  markdown += transitionMarks(active, [])
  return markdown
}

function inlineMark(mark: NanoMark, text: string): InlineMark | null {
  const textLength = text.length
  const from = Math.max(0, Math.min(mark.from, textLength))
  const to = Math.max(0, Math.min(mark.to, textLength))
  if (from >= to) return null

  switch (mark.type) {
    case 'link':
      return linkInlineMark(mark, from, to)
    case 'bold':
      return {
        key: `bold:${boldMarker(mark.marker)}`,
        priority: 20,
        from,
        to,
        open: boldMarker(mark.marker),
        close: boldMarker(mark.marker),
      }
    case 'italic':
      return {
        key: `italic:${italicMarker(mark.marker)}`,
        priority: 30,
        from,
        to,
        open: italicMarker(mark.marker),
        close: italicMarker(mark.marker),
      }
    case 'underline':
      return { key: 'underline', priority: 35, from, to, open: '~', close: '~' }
    case 'strike':
      return { key: 'strike', priority: 40, from, to, open: '~~', close: '~~' }
    case 'highlight':
      return { key: 'highlight', priority: 45, from, to, open: '==', close: '==' }
    case 'code': {
      const token = codeBacktickToken(mark.backtickLength, text.slice(from, to))
      return {
        key: `code:${token.length}`,
        priority: 50,
        from,
        to,
        open: token,
        close: token,
        rawText: true,
      }
    }
    case 'tag':
      return { key: `tag:${mark.name}`, priority: 60, from, to, open: '', close: '', rawText: true }
    case 'mention':
      return {
        key: `mention:${mark.id}:${mark.label ?? ''}`,
        priority: 62,
        from,
        to,
        open: '',
        close: '',
        replacement: `@${(mark.label || mark.id).replace(/^@/, '')}`,
        rawText: true,
      }
    case 'note_link':
      return { key: `note_link:${mark.target}:${mark.alias ?? ''}`, priority: 65, from, to, open: '', close: '', rawText: true }
    case 'math':
      return { key: `math:${mark.formula}`, priority: 70, from, to, open: '', close: '', rawText: true }
    case 'footnote_ref':
      return { key: `footnote_ref:${mark.name}`, priority: 75, from, to, open: '', close: '', rawText: true }
    case 'source':
      return { key: 'source', priority: 80, from, to, open: '', close: '', rawText: true }
    default:
      return null
  }
}

function linkInlineMark(mark: Extract<NanoMark, { type: 'link' }>, from: number, to: number): InlineMark {
  if (mark.image) {
    const close = markdownLinkClose(mark.href, mark.title, mark.destinationStyle)
    return mark.imageEmptyAlt
      ? {
          key: `image:${mark.href}:${mark.title ?? ''}:${mark.destinationStyle ?? ''}:empty-alt`,
          priority: 10,
          from,
          to,
          open: '!',
          close: close.slice(1),
          rawText: true,
        }
      : {
          key: `image:${mark.href}:${mark.title ?? ''}:${mark.destinationStyle ?? ''}`,
          priority: 10,
          from,
          to,
          open: '![',
          close,
        }
  }
  if (mark.syntax === 'autolink' || mark.syntax === 'bare') {
    return {
      key: `link:${mark.href}:${mark.syntax}`,
      priority: 10,
      from,
      to,
      open: '',
      close: '',
      rawText: true,
    }
  }
  return {
    key: `link:${mark.href}:${mark.title ?? ''}:${mark.destinationStyle ?? ''}`,
    priority: 10,
    from,
    to,
    open: '[',
    close: markdownLinkClose(mark.href, mark.title, mark.destinationStyle),
  }
}

function transitionMarks(active: readonly InlineMark[], next: readonly InlineMark[]): string {
  let shared = 0
  while (active[shared] && next[shared] && active[shared].key === next[shared].key) shared += 1

  return [
    ...active.slice(shared).reverse().map((mark) => mark.close),
    ...next.slice(shared).map((mark) => mark.open),
  ].join('')
}

function escapeMarkdownText(text: string, code = false, raw = false): string {
  if (raw) return text
  if (code) return text.replace(/`/g, '\\`')

  let markdown = ''
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? ''
    if (char === '#' && tagTokenAt(text, index)) {
      markdown += '\\#'
      continue
    }

    markdown += /[\\`*_~=[\]$]/.test(char) ? `\\${char}` : char
  }
  return markdown
}
