import type { AnyNanoMarkCodec } from './prosemirror-mark-codec-types'
import { defineNanoMarkCodec } from './prosemirror-mark-codec-types'
import {
  boldMarker,
  codeBacktickLength,
  italicMarker,
} from './prosemirror-mark-attrs'
import { nanoMarkNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const basicNanoMarkCodecs: readonly AnyNanoMarkCodec[] = [
  defineNanoMarkCodec({
    nanoType: 'bold',
    markName: nanoMarkNames.bold,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.bold].create({ marker: boldMarker(mark.marker) }),
    toNano: (mark, from, to) => ({
      type: 'bold',
      from,
      to,
      ...(boldMarker(mark.attrs.marker) !== '**' ? { marker: boldMarker(mark.attrs.marker) } : {}),
    }),
    key: (mark) => `bold:${boldMarker(mark.marker)}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'italic',
    markName: nanoMarkNames.italic,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.italic].create({ marker: italicMarker(mark.marker) }),
    toNano: (mark, from, to) => ({
      type: 'italic',
      from,
      to,
      ...(italicMarker(mark.attrs.marker) !== '*' ? { marker: italicMarker(mark.attrs.marker) } : {}),
    }),
    key: (mark) => `italic:${italicMarker(mark.marker)}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'underline',
    markName: nanoMarkNames.underline,
    fromNano: () => nanoSchema.marks[nanoMarkNames.underline].create(),
    toNano: (_mark, from, to) => ({ type: 'underline', from, to }),
  }),
  defineNanoMarkCodec({
    nanoType: 'strike',
    markName: nanoMarkNames.strike,
    fromNano: () => nanoSchema.marks[nanoMarkNames.strike].create(),
    toNano: (_mark, from, to) => ({ type: 'strike', from, to }),
  }),
  defineNanoMarkCodec({
    nanoType: 'highlight',
    markName: nanoMarkNames.highlight,
    fromNano: () => nanoSchema.marks[nanoMarkNames.highlight].create(),
    toNano: (_mark, from, to) => ({ type: 'highlight', from, to }),
  }),
  defineNanoMarkCodec({
    nanoType: 'code',
    markName: nanoMarkNames.code,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.code].create({ backtickLength: codeBacktickLength(mark.backtickLength) }),
    toNano: (mark, from, to) => ({
      type: 'code',
      from,
      to,
      ...(codeBacktickLength(mark.attrs.backtickLength) > 1 ? { backtickLength: codeBacktickLength(mark.attrs.backtickLength) } : {}),
    }),
    key: (mark) => `code:${codeBacktickLength(mark.backtickLength)}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'source',
    markName: nanoMarkNames.source,
    fromNano: () => nanoSchema.marks[nanoMarkNames.source].create(),
    toNano: (_mark, from, to) => ({ type: 'source', from, to }),
  }),
]
