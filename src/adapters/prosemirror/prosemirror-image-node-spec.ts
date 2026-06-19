import type { NodeSpec } from 'prosemirror-model'
import { nonBlankStringValue } from '../../entities/block/schema/nano-block-schema-refinements'
import {
  escapeMarkdownImageText,
  escapeMarkdownImageTitle,
} from '../../codecs/markdown/link/serialize'
import {
  destinationStyle,
  markdownLinkDestinationSource,
} from './prosemirror-link-dom'
import { prosemirrorParseDomElement } from './prosemirror-parse-dom'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'

export const imageNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: {
    id: { default: null },
    src: { default: '' },
    alt: { default: '' },
    destinationStyle: { default: '' },
    title: { default: '' },
  },
  parseDOM: [{
    tag: 'figure.nano-image',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const image = element.querySelector('img')
      const src = nonBlankStringValue(image?.getAttribute('src'))
      if (!src) return false

      return {
        src,
        alt: image?.getAttribute('alt') ?? '',
        destinationStyle: element.dataset.destinationStyle ?? '',
        title: image?.getAttribute('title') ?? '',
      }
    },
  }, {
    tag: 'img[src]',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const src = nonBlankStringValue(element.getAttribute('src'))
      return src ? {
        src,
        alt: element.getAttribute('alt') ?? '',
        title: element.getAttribute('title') ?? '',
      } : false
    },
  }],
  toDOM: (node) => [
    'figure',
    {
      class: 'nano-block nano-image',
      'data-id': node.attrs.id,
      ...(destinationStyle(node.attrs.destinationStyle)
        ? { 'data-destination-style': destinationStyle(node.attrs.destinationStyle) }
        : {}),
    },
    ['img', { src: node.attrs.src, alt: node.attrs.alt ?? '', ...(node.attrs.title ? { title: node.attrs.title } : {}) }],
    ['figcaption', hiddenSourceTokenAttrs('nano-image-markdown'), markdownImageToken(
      node.attrs.alt,
      node.attrs.src,
      node.attrs.title,
      node.attrs.destinationStyle,
    )],
  ],
}

function markdownImageToken(alt: unknown, src: unknown, title: unknown, rawDestinationStyle?: unknown): string {
  const label = escapeMarkdownImageText(String(alt ?? ''))
  const href = String(src ?? '')
  const imageTitle = typeof title === 'string' && title
    ? ` "${escapeMarkdownImageTitle(title)}"`
    : ''
  return `![${label}](${markdownLinkDestinationSource(href, rawDestinationStyle)}${imageTitle})`
}
