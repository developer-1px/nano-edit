import type { NodeSpec } from 'prosemirror-model'
import { nonBlankStringValue } from '../../core/schema/nano-block-schema-refinements'
import {
  destinationStyle,
  markdownImageToken,
} from './prosemirror-atom-dom'
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
      const image = (dom as HTMLElement).querySelector('img')
      const src = nonBlankStringValue(image?.getAttribute('src'))
      if (!src) return false

      return {
        src,
        alt: image?.getAttribute('alt') ?? '',
        destinationStyle: (dom as HTMLElement).dataset.destinationStyle ?? '',
        title: image?.getAttribute('title') ?? '',
      }
    },
  }, {
    tag: 'img[src]',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
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
