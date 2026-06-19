import type {
  DOMOutputSpec,
  NodeSpec,
} from 'prosemirror-model'
import {
  firstNonBlankStringValue,
  nonBlankStringValue,
} from '../../entities/block/schema/nano-block-schema-refinements'
import { noteLinkParts } from '../../entities/reference/nano-note-link'
import { normalizeTagName } from '../../entities/reference/nano-tag'
import {
  hrefDisplayLabel,
  hrefFileName,
} from '../../entities/reference/nano-url'
import {
  bookmarkSyntax,
  destinationStyle,
  markdownLinkClose,
} from './prosemirror-link-dom'
import {
  noteRefDomSpec,
  tagRefDomSpec,
} from './prosemirror-note-tag-dom'
import { prosemirrorParseDomElement } from './prosemirror-parse-dom'
import {
  hiddenSourceTokenAttrs,
  sourceTokenAttrs,
} from './prosemirror-source-token'

export const mentionNodeSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,
  selectable: true,
  attrs: { id: { default: '' }, label: { default: '' } },
  leafText: () => '\ufffc',
  parseDOM: [{
    tag: 'span.nano-mention-chip',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const id = nonBlankStringValue(element.dataset.mentionId)
      return id ? { id, label: element.dataset.mentionLabel ?? element.textContent?.replace(/^@/, '') ?? '' } : false
    },
  }],
  toDOM: (node) => mentionDomSpec(node.attrs.id, node.attrs.label),
}

export const bookmarkNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { id: { default: null }, href: { default: '' }, label: { default: '' }, title: { default: '' }, destinationStyle: { default: '' }, syntax: { default: 'bare' } },
  parseDOM: [{
    tag: 'div.nano-bookmark',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const href = firstNonBlankStringValue(element.dataset.href, element.querySelector('a')?.getAttribute('href'))
      if (!href) return false

      return {
        href,
        label: element.dataset.label ?? '',
        title: element.dataset.title ?? '',
        destinationStyle: element.dataset.destinationStyle ?? '',
        syntax: bookmarkSyntax(element.dataset.syntax),
      }
    },
  }],
  toDOM: (node) => bookmarkDomSpec(node.attrs.id, node.attrs.href, node.attrs.label, node.attrs.title, node.attrs.syntax, node.attrs.destinationStyle),
}

export const noteRefNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { id: { default: null }, target: { default: '' }, alias: { default: '' } },
  parseDOM: [{
    tag: 'div.nano-note-ref',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const parts = noteLinkParts(element.dataset.target ?? '') ?? noteLinkParts(element.textContent ?? '')
      const target = nonBlankStringValue(parts?.target)
      if (!target) return false

      return {
        target,
        alias: element.dataset.alias ?? parts?.alias ?? '',
      }
    },
  }],
  toDOM: (node) => noteRefDomSpec(node.attrs.id, node.attrs.target, node.attrs.alias),
}

export const tagRefNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { id: { default: null }, name: { default: '' } },
  parseDOM: [{
    tag: 'div.nano-tag-ref',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const name = firstNonBlankStringValue(
        normalizeTagName(element.dataset.tag ?? ''),
        normalizeTagName(element.textContent ?? ''),
      )
      return name ? { name } : false
    },
  }],
  toDOM: (node) => tagRefDomSpec(node.attrs.id, node.attrs.name),
}

export const attachmentNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { id: { default: null }, src: { default: '' }, label: { default: '' }, title: { default: '' }, destinationStyle: { default: '' } },
  parseDOM: [{
    tag: 'div.nano-attachment',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const src = firstNonBlankStringValue(element.dataset.src, element.querySelector('a')?.getAttribute('href'))
      if (!src) return false

      return {
        src,
        label: element.dataset.label ?? '',
        title: element.dataset.title ?? '',
        destinationStyle: element.dataset.destinationStyle ?? '',
      }
    },
  }],
  toDOM: (node) => attachmentDomSpec(node.attrs.id, node.attrs.src, node.attrs.label, node.attrs.title, node.attrs.destinationStyle),
}

function bookmarkDomSpec(id: unknown, href: unknown, label: unknown, title: unknown, syntax: unknown, rawDestinationStyle: unknown): DOMOutputSpec {
  const url = String(href ?? '')
  const bookmarkLabelText = typeof label === 'string' && label ? label : hrefDisplayLabel(url)
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
      ...detailDomChildren('nano-bookmark-detail', bookmarkTitle),
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

function mentionDomSpec(id: unknown, rawLabel: unknown): DOMOutputSpec {
  const label = String(rawLabel || id || '').replace(/^@/, '')
  const text = label ? `@${label}` : '@mention'
  return [
    'span',
    {
      class: 'nano-mention-chip',
      contenteditable: 'false',
      draggable: 'true',
      'data-mention-id': id,
      ...(label ? { 'data-mention-label': label } : {}),
      title: text,
    },
    text,
  ]
}

function attachmentDomSpec(id: unknown, src: unknown, label: unknown, title: unknown, rawDestinationStyle: unknown): DOMOutputSpec {
  const fileSrc = String(src ?? '')
  const attachmentLabelText = typeof label === 'string' && label ? label : hrefFileName(fileSrc)
  const attachmentTitle = typeof title === 'string' && title ? title : ''
  const attachmentDestinationStyle = destinationStyle(rawDestinationStyle)
  return [
    'div',
    {
      class: 'nano-block nano-attachment',
      'data-id': id,
      'data-src': fileSrc,
      ...(label ? { 'data-label': label } : {}),
      ...(title ? { 'data-title': title } : {}),
      ...(attachmentDestinationStyle ? { 'data-destination-style': attachmentDestinationStyle } : {}),
    },
    [
      'a',
      { class: 'nano-md-link nano-attachment-link', href: fileSrc, 'data-href': fileSrc, contenteditable: 'false', title: attachmentTitle || fileSrc },
      ['span', { class: 'nano-attachment-icon' }, attachmentIcon(fileSrc)],
      ['span', { class: 'nano-attachment-title' }, attachmentLabelText],
      ...detailDomChildren('nano-attachment-detail', attachmentTitle),
      ['span', hiddenSourceTokenAttrs('nano-attachment-src'), markdownAttachmentToken(attachmentLabelText, fileSrc, attachmentTitle, attachmentDestinationStyle)],
    ],
  ]
}

type DetailDomChildren = [string, readonly ['span', { class: string }, string]] | []

function detailDomChildren(className: string, text: string): DetailDomChildren {
  return text ? [' ', ['span', { class: className }, text]] : []
}

function markdownAttachmentToken(label: string, src: string, title: string, rawDestinationStyle?: unknown): string {
  return `[${label}${markdownLinkClose(src, title, rawDestinationStyle)}`
}

function attachmentIcon(src: string): string {
  const extension = hrefFileName(src).split('.').at(-1)?.toLowerCase() ?? ''
  if (extension === 'pdf') return 'PDF'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(extension)) return 'IMG'
  if (['zip', 'gz', 'tar', 'rar', '7z'].includes(extension)) return 'ZIP'
  return 'FILE'
}
