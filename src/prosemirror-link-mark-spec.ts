import type { MarkSpec } from 'prosemirror-model'
import {
  destinationStyle,
  linkSyntax,
  markdownLinkClose,
} from './prosemirror-atom-dom'
import { sourceTokenAttrs } from './prosemirror-source-token'

export const linkMarkSpec: MarkSpec = {
  attrs: {
    href: {},
    destinationStyle: { default: '' },
    title: { default: '' },
    syntax: { default: '' },
    image: { default: false },
    imageEmptyAlt: { default: false },
  },
  inclusive: false,
  parseDOM: [{
    tag: 'a[href]',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
      return {
        href: element.getAttribute('href'),
        destinationStyle: element.dataset.destinationStyle ?? '',
        title: element.dataset.title ?? '',
        syntax: element.dataset.syntax ?? '',
        image: element.dataset.image === 'true',
        imageEmptyAlt: element.dataset.imageEmptyAlt === 'true',
      }
    },
  }],
  toDOM: (mark) => {
    const syntax = linkSyntax(mark.attrs.syntax)
    const image = mark.attrs.image === true
    const imageEmptyAlt = image && mark.attrs.imageEmptyAlt === true
    const markdownClose = markdownLinkClose(mark.attrs.href, mark.attrs.title, mark.attrs.destinationStyle)
    return [
      'a',
      sourceTokenAttrs(syntax ? 'nano-md-link nano-raw-external-link' : `nano-md-token ${image ? 'nano-md-image' : 'nano-md-link'}`, {
        href: mark.attrs.href,
        'data-href': mark.attrs.href,
        ...(mark.attrs.title ? { 'data-title': mark.attrs.title } : {}),
        ...(syntax ? { 'data-syntax': syntax } : {
          'data-md-open': image ? (imageEmptyAlt ? '!' : '![') : '[',
          'data-md-close': imageEmptyAlt ? markdownClose.slice(1) : markdownClose,
          ...(destinationStyle(mark.attrs.destinationStyle)
            ? { 'data-destination-style': destinationStyle(mark.attrs.destinationStyle) }
            : {}),
          ...(image ? { 'data-image': 'true' } : {}),
          ...(imageEmptyAlt ? { 'data-image-empty-alt': 'true' } : {}),
        }),
        ...(syntax === 'autolink' ? { 'data-label': mark.attrs.href } : {}),
        title: mark.attrs.title || mark.attrs.href,
      }),
      0,
    ]
  },
}
