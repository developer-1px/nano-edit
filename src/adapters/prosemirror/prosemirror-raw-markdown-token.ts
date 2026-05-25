import type { DOMOutputSpec } from 'prosemirror-model'
import { footnoteRefAt } from '../../core/nano-footnote'
import { inlineMathTokenAt } from '../../core/nano-math'
import { tagDisplayLabel, tagTokenAt } from '../../core/nano-tag'
import {
  rawExternalUrlAt,
  rawLinkAt,
  rawNoteLinkAt,
} from './prosemirror-raw-markdown-links'
import { rawFormatAt } from './prosemirror-raw-markdown-format'

export function rawMarkdownTokenDomSpecAt(text: string, from: number): { spec: DOMOutputSpec; to: number } | null {
  const math = inlineMathTokenAt(text, from)
  if (math) {
    return { spec: ['span', { class: 'nano-raw-math', 'data-formula': math.formula, title: math.formula }, math.formula], to: math.to }
  }

  const footnote = footnoteRefAt(text, from)
  if (footnote) {
    return { spec: ['span', { class: 'nano-raw-footnote-ref', 'data-name': footnote.name, title: footnote.name }, footnote.name], to: footnote.to }
  }

  const noteLink = rawNoteLinkAt(text, from)
  if (noteLink) {
    return {
      spec: ['span', {
        class: 'nano-raw-note-link',
        'data-target': noteLink.target,
        ...(noteLink.alias ? { 'data-alias': noteLink.alias } : {}),
        title: noteLink.alias || noteLink.target,
      }, noteLink.alias || noteLink.target],
      to: noteLink.to,
    }
  }

  const link = rawLinkAt(text, from)
  if (link) {
    return {
      spec: ['span', {
        class: 'nano-raw-link',
        'data-href': link.href,
        ...(link.title ? { 'data-title': link.title } : {}),
        title: link.title ?? link.href,
      }, link.label],
      to: link.to,
    }
  }

  const url = rawExternalUrlAt(text, from)
  if (url) {
    return { spec: ['span', { class: 'nano-raw-link', 'data-href': url.href, 'data-syntax': url.syntax, title: url.href }, url.href], to: url.to }
  }

  const format = rawFormatAt(text, from)
  if (format) {
    return { spec: ['span', { class: `nano-raw-format ${format.className}`, title: format.content }, format.content], to: format.to }
  }

  const tag = tagTokenAt(text, from)
  if (tag) {
    const label = tagDisplayLabel(tag.name) ?? tag.name
    return { spec: ['span', { class: 'nano-raw-tag', 'data-tag': tag.name, title: label }, label], to: tag.to }
  }

  return null
}

export function nextRawMarkdownTokenIndex(text: string, from: number): number {
  const indexes = ['$', '[[', '[', '<http://', '<https://', '<mailto:', 'http://', 'https://', 'mailto:', '#', '**', '__', '~~', '~', '==', '`', '*', '_']
    .map((token) => text.indexOf(token, from))
    .filter((index) => index >= 0)
  return indexes.length > 0 ? Math.min(...indexes) : text.length
}

export function isEscapedRawMarkdownToken(text: string, from: number): boolean {
  if (from <= 0 || text[from - 1] !== '\\') return false

  let slashCount = 0
  for (let index = from - 1; index >= 0 && text[index] === '\\'; index -= 1) {
    slashCount += 1
  }
  return slashCount % 2 === 1
}
