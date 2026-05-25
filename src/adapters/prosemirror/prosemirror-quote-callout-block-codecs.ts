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
    toNano: (node, id) => {
      const text = node.textContent
      const quoteMarkerSpacing = normalizeLineMarkerSpacing(
        node.attrs.quoteMarkerSpacing,
        text,
        (line) => line ? 'space' : 'none',
      )
      const quoteMarkerDepths = normalizeLineMarkerDepths(node.attrs.quoteMarkerDepths, text)

      return {
        id,
        type: 'quote',
        ...(quoteMarkerSpacing ? { quoteMarkerSpacing } : {}),
        ...(quoteMarkerDepths ? { quoteMarkerDepths } : {}),
        text,
        marks: nanoMarksFromProseMirrorNode(node),
      }
    },
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
    toNano: (node, id) => {
      const text = node.textContent
      const calloutMarkerDepths = normalizeLineMarkerDepths(node.attrs.calloutMarkerDepths, text)
      const calloutMarkerSpacing = normalizeLineMarkerSpacing(
        node.attrs.calloutMarkerSpacing,
        text,
        (line, index) => index === 0 ? 'none' : line ? 'space' : 'none',
      )

      return {
        id,
        type: 'callout',
        tone: calloutTone(node.attrs.tone),
        ...(calloutMarkerDepths ? { calloutMarkerDepths } : {}),
        ...(calloutMarkerSpacing ? { calloutMarkerSpacing } : {}),
        ...(quoteMarkerSpacingValue(node.attrs.calloutTextSpacing)
          ? { calloutTextSpacing: quoteMarkerSpacingValue(node.attrs.calloutTextSpacing)! }
          : {}),
        text,
        marks: nanoMarksFromProseMirrorNode(node),
      }
    },
  }),
]

function normalizeLineMarkerSpacing(
  spacing: unknown,
  text: string,
  fallback: (line: string, index: number) => 'space' | 'none',
): Array<'space' | 'none'> | null {
  const normalized = normalizeQuoteMarkerSpacing(spacing)
  if (!normalized) return null

  return text.split('\n').map((line, index) => normalized[index] ?? fallback(line, index))
}

function normalizeLineMarkerDepths(depths: unknown, text: string): number[] | null {
  const normalized = normalizeQuoteMarkerDepths(depths)
  if (!normalized) return null

  const values = Array.from({ length: text.split('\n').length }, (_value, index) => normalized[index] ?? 1)
  return values.some((value) => value !== 1) ? values : null
}
