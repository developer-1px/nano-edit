import {
  calloutTone,
  normalizeQuoteMarkerDepths,
  normalizeQuoteMarkerSpacing,
  quoteMarkerSpacingValue,
} from './prosemirror-block-attrs'
import {
  defineNanoBlockCodec,
  type AnyNanoBlockCodec,
} from './prosemirror-block-codec-types'
import {
  inlineContentFromText,
  nanoMarksFromProseMirrorNode,
} from './prosemirror-mark-codecs'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const quoteCalloutBlockCodecs: readonly AnyNanoBlockCodec[] = [
  defineNanoBlockCodec({
    nanoType: 'quote',
    nodeName: nanoNodeNames.quote,
    fromNano: (block) => nanoSchema.nodes[nanoNodeNames.quote].create(
      {
        id: block.id,
        quoteMarkerSpacing: normalizeQuoteMarkerSpacing(block.quoteMarkerSpacing),
        quoteMarkerDepths: normalizeQuoteMarkerDepths(block.quoteMarkerDepths),
      },
      inlineContentFromText(block.text, block.marks),
    ),
    toNano: (node, id) => ({
      id,
      type: 'quote',
      ...(normalizeQuoteMarkerSpacing(node.attrs.quoteMarkerSpacing)
        ? { quoteMarkerSpacing: normalizeQuoteMarkerSpacing(node.attrs.quoteMarkerSpacing)! }
        : {}),
      ...(normalizeQuoteMarkerDepths(node.attrs.quoteMarkerDepths)
        ? { quoteMarkerDepths: normalizeQuoteMarkerDepths(node.attrs.quoteMarkerDepths)! }
        : {}),
      text: node.textContent,
      marks: nanoMarksFromProseMirrorNode(node),
    }),
  }),
  defineNanoBlockCodec({
    nanoType: 'callout',
    nodeName: nanoNodeNames.callout,
    fromNano: (block) => nanoSchema.nodes[nanoNodeNames.callout].create(
      {
        id: block.id,
        tone: calloutTone(block.tone),
        calloutMarkerDepths: normalizeQuoteMarkerDepths(block.calloutMarkerDepths),
        calloutMarkerSpacing: normalizeQuoteMarkerSpacing(block.calloutMarkerSpacing),
        calloutTextSpacing: quoteMarkerSpacingValue(block.calloutTextSpacing),
      },
      inlineContentFromText(block.text, block.marks),
    ),
    toNano: (node, id) => ({
      id,
      type: 'callout',
      tone: calloutTone(node.attrs.tone),
      ...(normalizeQuoteMarkerDepths(node.attrs.calloutMarkerDepths)
        ? { calloutMarkerDepths: normalizeQuoteMarkerDepths(node.attrs.calloutMarkerDepths)! }
        : {}),
      ...(normalizeQuoteMarkerSpacing(node.attrs.calloutMarkerSpacing)
        ? { calloutMarkerSpacing: normalizeQuoteMarkerSpacing(node.attrs.calloutMarkerSpacing)! }
        : {}),
      ...(quoteMarkerSpacingValue(node.attrs.calloutTextSpacing)
        ? { calloutTextSpacing: quoteMarkerSpacingValue(node.attrs.calloutTextSpacing)! }
        : {}),
      text: node.textContent,
      marks: nanoMarksFromProseMirrorNode(node),
    }),
  }),
]
