import type { MarkSpec } from 'prosemirror-model'
import {
  boldMarker,
  codeBacktickLength,
  codeBacktickToken,
  italicMarker,
} from '../../codecs/markdown/nano-markdown-inline-utils'
import { nanoMarkNames } from './prosemirror-names'
import { prosemirrorParseDomElement } from './prosemirror-parse-dom'
import { sourceTokenAttrs } from './prosemirror-source-token'

export const basicMarkSpecs: Record<string, MarkSpec> = {
  [nanoMarkNames.bold]: {
    attrs: { marker: { default: '**' } },
    parseDOM: [
      {
        tag: 'strong',
        getAttrs: (dom) => {
          const element = prosemirrorParseDomElement(dom)
          return element ? { marker: boldMarker(element.dataset.mdOpen) } : false
        },
      },
      {
        tag: 'b',
        getAttrs: (dom) => {
          const element = prosemirrorParseDomElement(dom)
          return element ? { marker: boldMarker(element.dataset.mdOpen) } : false
        },
      },
    ],
    toDOM: (mark) => {
      const marker = boldMarker(mark.attrs.marker)
      return ['strong', sourceTokenAttrs('nano-md-token nano-md-bold', { 'data-md-open': marker, 'data-md-close': marker }), 0]
    },
  },
  [nanoMarkNames.italic]: {
    attrs: { marker: { default: '*' } },
    parseDOM: [
      {
        tag: 'em',
        getAttrs: (dom) => {
          const element = prosemirrorParseDomElement(dom)
          return element ? { marker: italicMarker(element.dataset.mdOpen) } : false
        },
      },
      {
        tag: 'i',
        getAttrs: (dom) => {
          const element = prosemirrorParseDomElement(dom)
          return element ? { marker: italicMarker(element.dataset.mdOpen) } : false
        },
      },
    ],
    toDOM: (mark) => {
      const marker = italicMarker(mark.attrs.marker)
      return ['em', sourceTokenAttrs('nano-md-token nano-md-italic', { 'data-md-open': marker, 'data-md-close': marker }), 0]
    },
  },
  [nanoMarkNames.underline]: {
    parseDOM: [{ tag: 'u' }, { tag: 'span.nano-underline' }],
    toDOM: () => ['u', sourceTokenAttrs('nano-underline nano-md-token nano-md-underline', { 'data-md-open': '~', 'data-md-close': '~' }), 0],
  },
  [nanoMarkNames.strike]: {
    parseDOM: [{ tag: 's' }, { tag: 'del' }],
    toDOM: () => ['s', sourceTokenAttrs('nano-md-token nano-md-strike', { 'data-md-open': '~~', 'data-md-close': '~~' }), 0],
  },
  [nanoMarkNames.highlight]: {
    parseDOM: [{ tag: 'mark' }, { tag: 'span.nano-highlight' }],
    toDOM: () => ['mark', sourceTokenAttrs('nano-highlight nano-md-token nano-md-highlight', { 'data-md-open': '==', 'data-md-close': '==' }), 0],
  },
  [nanoMarkNames.code]: {
    attrs: { backtickLength: { default: null } },
    parseDOM: [{
      tag: 'code',
      getAttrs: (dom) => {
        const element = prosemirrorParseDomElement(dom)
        return element ? { backtickLength: codeBacktickLength(element.dataset.backtickLength) } : false
      },
    }],
    toDOM: (mark) => {
      const token = codeBacktickToken(mark.attrs.backtickLength)
      return ['code', sourceTokenAttrs('nano-inline-code nano-md-token nano-md-code', {
        'data-backtick-length': String(token.length),
        'data-md-open': token,
        'data-md-close': token,
      }), 0]
    },
  },
  [nanoMarkNames.source]: {
    parseDOM: [{ tag: 'span.nano-raw-source' }],
    toDOM: () => ['span', sourceTokenAttrs('nano-raw-source'), 0],
  },
}
