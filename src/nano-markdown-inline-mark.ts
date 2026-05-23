import type { NanoMark } from './nano-core'
import { markdownLinkClose } from './nano-markdown-link'
import {
  boldMarker,
  codeBacktickToken,
  italicMarker,
} from './nano-markdown-inline-utils'

export interface InlineMark {
  key: string
  priority: number
  from: number
  to: number
  open: string
  close: string
  rawText?: boolean
}

export function inlineMark(mark: NanoMark, text: string): InlineMark | null {
  const textLength = text.length
  const from = Math.max(0, Math.min(mark.from, textLength))
  const to = Math.max(0, Math.min(mark.to, textLength))
  if (from >= to) return null

  switch (mark.type) {
    case 'link':
      return linkInlineMark(mark, from, to)
    case 'bold':
      return { key: `bold:${boldMarker(mark.marker)}`, priority: 20, from, to, open: boldMarker(mark.marker), close: boldMarker(mark.marker) }
    case 'italic':
      return { key: `italic:${italicMarker(mark.marker)}`, priority: 30, from, to, open: italicMarker(mark.marker), close: italicMarker(mark.marker) }
    case 'underline':
      return { key: 'underline', priority: 35, from, to, open: '~', close: '~' }
    case 'strike':
      return { key: 'strike', priority: 40, from, to, open: '~~', close: '~~' }
    case 'highlight':
      return { key: 'highlight', priority: 45, from, to, open: '==', close: '==' }
    case 'code': {
      const token = codeBacktickToken(mark.backtickLength, text.slice(from, to))
      return { key: `code:${token.length}`, priority: 50, from, to, open: token, close: token, rawText: true }
    }
    case 'tag':
      return { key: `tag:${mark.name}`, priority: 60, from, to, open: '', close: '', rawText: true }
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
    return { key: `link:${mark.href}:${mark.syntax}`, priority: 10, from, to, open: '', close: '', rawText: true }
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
