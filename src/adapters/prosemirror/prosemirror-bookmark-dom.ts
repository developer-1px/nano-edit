import type { DOMOutputSpec } from 'prosemirror-model'
import { sourceTokenAttrs } from './prosemirror-source-token'
import {
  bookmarkSyntax,
  destinationStyle,
  markdownLinkClose,
} from './prosemirror-link-dom'

export function bookmarkDomSpec(id: unknown, href: unknown, label: unknown, title: unknown, syntax: unknown, rawDestinationStyle: unknown): DOMOutputSpec {
  const url = String(href ?? '')
  const bookmarkLabelText = typeof label === 'string' && label ? label : bookmarkLabel(url)
  const bookmarkTitle = typeof title === 'string' && title ? title : ''
  const linkSyntaxValue = bookmarkSyntax(syntax)
  const bookmarkDestinationStyle = destinationStyle(rawDestinationStyle)
  return [
    'div',
    {
      class: 'nano-block nano-bookmark',
      'data-id': id,
      'data-href': url,
      ...(label ? { 'data-label': label } : {}),
      ...(title ? { 'data-title': title } : {}),
      ...(bookmarkDestinationStyle ? { 'data-destination-style': bookmarkDestinationStyle } : {}),
      'data-syntax': linkSyntaxValue,
    },
    [
      'a',
      { class: 'nano-md-link nano-bookmark-link', href: url, 'data-href': url, contenteditable: 'false', title: url },
      ['span', { class: 'nano-bookmark-title' }, bookmarkLabelText],
      ...(bookmarkTitle ? [' ', ['span', { class: 'nano-bookmark-detail' }, bookmarkTitle] as DOMOutputSpec] : []),
      ' ',
      ['span', sourceTokenAttrs('nano-bookmark-url', {
        contenteditable: 'false',
        'data-source': bookmarkMarkdownToken(url, bookmarkLabelText, bookmarkTitle, linkSyntaxValue, bookmarkDestinationStyle),
      }), url],
    ],
  ]
}

function bookmarkMarkdownToken(href: string, label: string, title: string, syntax: 'autolink' | 'bare' | 'markdown', rawDestinationStyle?: unknown): string {
  if (syntax === 'autolink') return `<${href}>`
  if (syntax === 'markdown') return `[${label}${markdownLinkClose(href, title, rawDestinationStyle)}`
  return href
}

function bookmarkLabel(href: string): string {
  try {
    const url = new URL(href)
    return url.protocol === 'mailto:' ? href.replace(/^mailto:/i, '') : url.hostname || href
  } catch {
    return href.replace(/^https?:\/\//i, '').replace(/^mailto:/i, '')
  }
}
