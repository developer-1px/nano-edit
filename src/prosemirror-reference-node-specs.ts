import type { NodeSpec } from 'prosemirror-model'
import { nonBlankStringValue } from './nano-block-schema-refinements'
import { noteLinkParts } from './nano-note-link'
import { normalizeTagName } from './nano-tag'
import {
  attachmentDomSpec,
  bookmarkDomSpec,
  bookmarkSyntax,
  noteRefDomSpec,
  tagRefDomSpec,
} from './prosemirror-atom-dom'

export const bookmarkNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { id: { default: null }, href: { default: '' }, label: { default: '' }, title: { default: '' }, destinationStyle: { default: '' }, syntax: { default: 'bare' } },
  parseDOM: [{
    tag: 'div.nano-bookmark',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
      const href = nonBlankStringValue(element.dataset.href ?? element.querySelector('a')?.getAttribute('href'))
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
      const element = dom as HTMLElement
      const parts = noteLinkParts(element.dataset.target ?? element.textContent ?? '')
      const target = nonBlankStringValue(parts?.target ?? element.dataset.target)
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
      const element = dom as HTMLElement
      const name = nonBlankStringValue(normalizeTagName(element.dataset.tag ?? element.textContent ?? ''))
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
      const element = dom as HTMLElement
      const src = nonBlankStringValue(element.dataset.src ?? element.querySelector('a')?.getAttribute('href'))
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
