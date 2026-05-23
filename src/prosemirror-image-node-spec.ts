import type { NodeSpec } from 'prosemirror-model'
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
      return {
        src: image?.getAttribute('src') ?? '',
        alt: image?.getAttribute('alt') ?? '',
        destinationStyle: (dom as HTMLElement).dataset.destinationStyle ?? '',
        title: image?.getAttribute('title') ?? '',
      }
    },
  }, {
    tag: 'img[src]',
    getAttrs: (dom) => ({
      src: (dom as HTMLElement).getAttribute('src') ?? '',
      alt: (dom as HTMLElement).getAttribute('alt') ?? '',
      title: (dom as HTMLElement).getAttribute('title') ?? '',
    }),
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
