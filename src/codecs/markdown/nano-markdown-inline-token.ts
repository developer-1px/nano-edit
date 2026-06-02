import { footnoteRefAt } from '../../core/nano-footnote'
import { inlineMathTokenAt } from '../../core/nano-math'
import {
  markdownLinkAt,
  markdownNoteLinkAt,
} from './link/index'
import { tagTokenAt } from '../../core/nano-tag'
import { externalUrlTokenAt, type UrlSyntax } from '../../core/nano-url'
import { markdownCodeSpanAt } from './nano-markdown-inline-code-span'
import {
  findItalicClose,
  findUnderlineClose,
  findUnderscoreItalicClose,
} from './nano-markdown-inline-close'

export type NanoMarkWithoutRange =
  | { type: 'bold'; marker?: '**' | '__' }
  | { type: 'italic'; marker?: '*' | '_' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'highlight' }
  | { type: 'code'; backtickLength?: number }
  | { type: 'tag'; name: string }
  | { type: 'note_link'; target: string; alias?: string }
  | { type: 'math'; formula: string }
  | { type: 'footnote_ref'; name: string }
  | { type: 'link'; href: string; destinationStyle?: 'angle'; title?: string; syntax?: UrlSyntax }

type InlineMarkdownToken =
  | { kind: 'text'; text: string; to: number }
  | { kind: 'parsedMark'; content: string; mark: NanoMarkWithoutRange; to: number }
  | { kind: 'literalMark'; token: string; mark: NanoMarkWithoutRange; to: number }
  | { kind: 'codeMark'; content: string; backtickLength: number; to: number }

export function inlineMarkdownTokenAt(source: string, index: number): InlineMarkdownToken {
  if (source[index] === '\\' && index + 1 < source.length) {
    return { kind: 'text', text: source[index + 1]!, to: index + 2 }
  }

  const literal = literalInlineTokenAt(source, index)
  if (literal) return literal

  const parsed = parsedInlineTokenAt(source, index)
  if (parsed) return parsed

  const code = markdownCodeSpanAt(source, index)
  if (code) return { kind: 'codeMark', content: code.content, backtickLength: code.backtickLength, to: code.to }

  const tag = tagTokenAt(source, index)
  if (tag) return { kind: 'literalMark', token: tag.token, mark: { type: 'tag', name: tag.name }, to: tag.to }

  return { kind: 'text', text: source[index]!, to: index + 1 }
}

function literalInlineTokenAt(source: string, index: number): InlineMarkdownToken | null {
  const math = inlineMathTokenAt(source, index)
  if (math) return { kind: 'literalMark', token: math.token, mark: { type: 'math', formula: math.formula }, to: math.to }

  const footnote = footnoteRefAt(source, index)
  if (footnote) return { kind: 'literalMark', token: footnote.token, mark: { type: 'footnote_ref', name: footnote.name }, to: footnote.to }

  const noteLink = markdownNoteLinkAt(source, index)
  if (noteLink) {
    return {
      kind: 'literalMark',
      token: noteLink.token,
      mark: { type: 'note_link', target: noteLink.target, ...(noteLink.alias ? { alias: noteLink.alias } : {}) },
      to: noteLink.to,
    }
  }

  const url = externalUrlTokenAt(source, index)
  if (url) return { kind: 'literalMark', token: url.token, mark: { type: 'link', href: url.href, syntax: url.syntax }, to: url.to }
  return null
}

function parsedInlineTokenAt(source: string, index: number): InlineMarkdownToken | null {
  const link = markdownLinkAt(source, index)
  if (link) {
    return {
      kind: 'parsedMark',
      content: link.label,
      mark: {
        type: 'link',
        href: link.href,
        ...(link.destinationStyle ? { destinationStyle: link.destinationStyle } : {}),
        ...(link.title ? { title: link.title } : {}),
      },
      to: link.to,
    }
  }

  const delimited = delimitedInlineTokenAt(source, index)
  if (delimited) return delimited

  const italicTo = source[index] === '*' && source[index + 1] !== '*' ? findItalicClose(source, index + 1) : -1
  if (italicTo > index + 1) {
    return { kind: 'parsedMark', content: source.slice(index + 1, italicTo), mark: { type: 'italic' }, to: italicTo + 1 }
  }

  const underscoreItalicTo = source[index] === '_' && source[index + 1] !== '_' ? findUnderscoreItalicClose(source, index + 1) : -1
  if (underscoreItalicTo > index + 1) {
    return { kind: 'parsedMark', content: source.slice(index + 1, underscoreItalicTo), mark: { type: 'italic', marker: '_' }, to: underscoreItalicTo + 1 }
  }

  return null
}

function delimitedInlineTokenAt(source: string, index: number): InlineMarkdownToken | null {
  const boldTo = source.startsWith('**', index) ? source.indexOf('**', index + 2) : -1
  if (boldTo > index + 2) return { kind: 'parsedMark', content: source.slice(index + 2, boldTo), mark: { type: 'bold' }, to: boldTo + 2 }

  const underscoreBoldTo = source.startsWith('__', index) ? source.indexOf('__', index + 2) : -1
  if (underscoreBoldTo > index + 2) return { kind: 'parsedMark', content: source.slice(index + 2, underscoreBoldTo), mark: { type: 'bold', marker: '__' }, to: underscoreBoldTo + 2 }

  const strikeTo = source.startsWith('~~', index) ? source.indexOf('~~', index + 2) : -1
  if (strikeTo > index + 2) return { kind: 'parsedMark', content: source.slice(index + 2, strikeTo), mark: { type: 'strike' }, to: strikeTo + 2 }

  const underlineTo = source[index] === '~' && source[index + 1] !== '~' ? findUnderlineClose(source, index + 1) : -1
  if (underlineTo > index + 1) return { kind: 'parsedMark', content: source.slice(index + 1, underlineTo), mark: { type: 'underline' }, to: underlineTo + 1 }

  const highlightTo = source.startsWith('==', index) ? source.indexOf('==', index + 2) : -1
  if (highlightTo > index + 2) return { kind: 'parsedMark', content: source.slice(index + 2, highlightTo), mark: { type: 'highlight' }, to: highlightTo + 2 }

  return null
}
