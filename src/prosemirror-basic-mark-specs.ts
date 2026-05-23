import type { MarkSpec } from 'prosemirror-model'
import {
  boldMarker,
  codeBacktickLength,
  codeBacktickToken,
  italicMarker,
} from './prosemirror-mark-attrs'
import { nanoMarkNames } from './prosemirror-names'
import { sourceTokenAttrs } from './prosemirror-source-token'

export const basicMarkSpecs: Record<string, MarkSpec> = {
  [nanoMarkNames.bold]: {
    attrs: { marker: { default: '**' } },
    parseDOM: [
      { tag: 'strong', getAttrs: (dom) => ({ marker: boldMarker((dom as HTMLElement).dataset.mdOpen) }) },
      { tag: 'b', getAttrs: (dom) => ({ marker: boldMarker((dom as HTMLElement).dataset.mdOpen) }) },
    ],
    toDOM: (mark) => {
      const marker = boldMarker(mark.attrs.marker)
      return ['strong', sourceTokenAttrs('nano-md-token nano-md-bold', { 'data-md-open': marker, 'data-md-close': marker }), 0]
    },
  },
  [nanoMarkNames.italic]: {
    attrs: { marker: { default: '*' } },
    parseDOM: [
      { tag: 'em', getAttrs: (dom) => ({ marker: italicMarker((dom as HTMLElement).dataset.mdOpen) }) },
      { tag: 'i', getAttrs: (dom) => ({ marker: italicMarker((dom as HTMLElement).dataset.mdOpen) }) },
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
      getAttrs: (dom) => ({ backtickLength: codeBacktickLength((dom as HTMLElement).dataset.backtickLength) }),
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
