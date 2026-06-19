import type { DOMOutputSpec } from 'prosemirror-model'
import { inlineMathTokenAt } from '../../entities/math/nano-math'
import { footnoteRefAt } from '../../entities/reference/nano-footnote'
import { noteLinkParts } from '../../entities/reference/nano-note-link'
import {
  tagDisplayLabel,
  tagTokenAt,
} from '../../entities/reference/nano-tag'
import { externalUrlTokenAt } from '../../entities/reference/nano-url'

type DOMOutputChild = DOMOutputSpec | string

export function rawMarkdownInlineDomSpec(text: string): DOMOutputChild[] {
  const specs: DOMOutputChild[] = []
  let index = 0

  const appendText = (value: string) => {
    if (value) specs.push(value)
  }

  while (index < text.length) {
    if (isEscapedRawMarkdownToken(text, index)) {
      const nextToken = nextRawMarkdownTokenIndex(text, index + 1)
      appendText(text.slice(index, nextToken))
      index = nextToken
      continue
    }

    const token = rawMarkdownTokenDomSpecAt(text, index)
    if (token) {
      specs.push(token.spec)
      index = token.to
      continue
    }

    const nextToken = nextRawMarkdownTokenIndex(text, index + 1)
    appendText(text.slice(index, nextToken))
    index = nextToken
  }

  return specs
}

function rawMarkdownTokenDomSpecAt(text: string, from: number): { spec: DOMOutputSpec; to: number } | null {
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

function nextRawMarkdownTokenIndex(text: string, from: number): number {
  const indexes = ['$', '[[', '[', '<http://', '<https://', '<mailto:', 'http://', 'https://', 'mailto:', '#', '**', '__', '~~', '~', '==', '`', '*', '_']
    .map((token) => text.indexOf(token, from))
    .filter((index) => index >= 0)
  return indexes.length > 0 ? Math.min(...indexes) : text.length
}

function isEscapedRawMarkdownToken(text: string, from: number): boolean {
  if (from <= 0 || text[from - 1] !== '\\') return false

  let slashCount = 0
  for (let index = from - 1; index >= 0 && text[index] === '\\'; index -= 1) {
    slashCount += 1
  }
  return slashCount % 2 === 1
}

function rawExternalUrlAt(
  text: string,
  from: number,
): { token: string; href: string; syntax: 'autolink' | 'bare'; to: number } | null {
  return externalUrlTokenAt(text, from)
}

function rawNoteLinkAt(text: string, from: number): { token: string; target: string; alias?: string; to: number } | null {
  if (!text.startsWith('[[', from)) return null

  const closeFrom = text.indexOf(']]', from + 2)
  if (closeFrom <= from + 2) return null

  const parts = noteLinkParts(text.slice(from + 2, closeFrom))
  if (!parts) return null

  return {
    token: text.slice(from, closeFrom + 2),
    ...parts,
    to: closeFrom + 2,
  }
}

function rawLinkAt(text: string, from: number): { token: string; label: string; href: string; title?: string; to: number } | null {
  if (text[from] !== '[' || text[from - 1] === '!') return null

  const middle = text.indexOf('](', from + 1)
  if (middle < 0) return null

  const to = text.indexOf(')', middle + 2)
  if (to < 0) return null

  const label = text.slice(from + 1, middle).trim()
  const destination = rawLinkDestination(text.slice(middle + 2, to))
  if (!label || !destination) return null

  return { token: text.slice(from, to + 1), label, ...destination, to: to + 1 }
}

function rawLinkDestination(source: string): { href: string; title?: string } | null {
  const match = /^(\S+)(?:\s+"((?:\\.|[^"\\])*)")?$/.exec(source.trim())
  if (!match) return null

  const href = match[1] ?? ''
  if (!href) return null

  const title = match[2]?.replace(/\\([\\"])/g, '$1')
  return { href, ...(title ? { title } : {}) }
}

function rawFormatAt(text: string, from: number): { token: string; content: string; className: string; to: number } | null {
  return rawDelimitedFormatAt(text, from, '**', 'nano-raw-bold')
    ?? rawDelimitedFormatAt(text, from, '__', 'nano-raw-bold')
    ?? rawDelimitedFormatAt(text, from, '~~', 'nano-raw-strike')
    ?? rawDelimitedFormatAt(text, from, '~', 'nano-raw-underline')
    ?? rawDelimitedFormatAt(text, from, '==', 'nano-raw-highlight')
    ?? rawDelimitedFormatAt(text, from, '`', 'nano-raw-code')
    ?? rawItalicAt(text, from)
    ?? rawUnderscoreItalicAt(text, from)
}

function rawDelimitedFormatAt(
  text: string,
  from: number,
  delimiter: string,
  className: string,
): { token: string; content: string; className: string; to: number } | null {
  if (!text.startsWith(delimiter, from)) return null

  const closeFrom = text.indexOf(delimiter, from + delimiter.length)
  if (closeFrom <= from + delimiter.length) return null

  const content = text.slice(from + delimiter.length, closeFrom)
  if (!content.trim()) return null

  return {
    token: text.slice(from, closeFrom + delimiter.length),
    content,
    className,
    to: closeFrom + delimiter.length,
  }
}

function rawItalicAt(text: string, from: number): { token: string; content: string; className: string; to: number } | null {
  if (text[from] !== '*' || text[from - 1] === '*' || text[from + 1] === '*') return null

  for (let index = from + 1; index < text.length; index += 1) {
    if (text[index] !== '*' || text[index - 1] === '*' || text[index + 1] === '*') continue

    const content = text.slice(from + 1, index)
    if (!content.trim()) return null
    return { token: text.slice(from, index + 1), content, className: 'nano-raw-italic', to: index + 1 }
  }

  return null
}

function rawUnderscoreItalicAt(text: string, from: number): { token: string; content: string; className: string; to: number } | null {
  if (text[from] !== '_' || text[from - 1] === '_' || text[from + 1] === '_') return null

  for (let index = from + 1; index < text.length; index += 1) {
    if (text[index] !== '_' || text[index - 1] === '_' || text[index + 1] === '_') continue

    const content = text.slice(from + 1, index)
    if (!content.trim()) return null
    return { token: text.slice(from, index + 1), content, className: 'nano-raw-italic', to: index + 1 }
  }

  return null
}
