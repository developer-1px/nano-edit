import type { NodeSpec } from 'prosemirror-model'
import { AlertTriangle, Diamond, Info, Lightbulb } from 'lucide'
import type { CalloutTone } from '../../assembly/capability'
import { lucideIcon } from '../../view/nano-icons'
import {
  calloutMarkerToken,
  calloutTone,
  decodeQuoteMarkerDepths,
  decodeQuoteMarkerSpacing,
  encodeQuoteMarkerDepths,
  encodeQuoteMarkerSpacing,
  quoteMarkerSpacingValue,
  quotePrefixToken,
} from './prosemirror-block-attrs'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'

export const quoteNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: { id: { default: null }, quoteMarkerSpacing: { default: null }, quoteMarkerDepths: { default: null } },
  parseDOM: [{
    tag: 'blockquote.nano-quote',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
      return {
        quoteMarkerSpacing: decodeQuoteMarkerSpacing(element.dataset.quoteMarkerSpacing),
        quoteMarkerDepths: decodeQuoteMarkerDepths(element.dataset.quoteMarkerDepths),
      }
    },
  }],
  toDOM: (node) => [
    'blockquote',
    {
      class: 'nano-block nano-quote',
      'data-id': node.attrs.id,
      ...(encodeQuoteMarkerSpacing(node.attrs.quoteMarkerSpacing)
        ? { 'data-quote-marker-spacing': encodeQuoteMarkerSpacing(node.attrs.quoteMarkerSpacing) }
        : {}),
      ...(encodeQuoteMarkerDepths(node.attrs.quoteMarkerDepths)
        ? { 'data-quote-marker-depths': encodeQuoteMarkerDepths(node.attrs.quoteMarkerDepths) }
        : {}),
    },
    ['span', hiddenSourceTokenAttrs('nano-block-md-prefix'), quotePrefixToken(node.attrs.quoteMarkerSpacing, node.attrs.quoteMarkerDepths)],
    ['span', { class: 'nano-block-content' }, 0],
  ],
}

export const calloutNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  defining: true,
  attrs: {
    id: { default: null },
    tone: { default: 'note' },
    calloutMarkerDepths: { default: null },
    calloutMarkerSpacing: { default: null },
    calloutTextSpacing: { default: null },
  },
  parseDOM: [{
    tag: 'aside.nano-callout',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
      return {
        tone: calloutTone(element.dataset.tone),
        calloutMarkerDepths: decodeQuoteMarkerDepths(element.dataset.calloutMarkerDepths),
        calloutMarkerSpacing: decodeQuoteMarkerSpacing(element.dataset.calloutMarkerSpacing),
        calloutTextSpacing: quoteMarkerSpacingValue(element.dataset.calloutTextSpacing),
      }
    },
  }],
  toDOM: (node) => {
    const tone = calloutTone(node.attrs.tone)
    return [
      'aside',
      {
        class: 'nano-block nano-callout',
        'data-id': node.attrs.id,
        'data-tone': tone,
        ...calloutDataAttrs(node.attrs),
      },
      ['span', { class: 'nano-callout-icon', contenteditable: 'false', 'aria-hidden': 'true' }, lucideIcon(calloutIcon(tone), 'nano-callout-icon-svg')],
      ['span', hiddenSourceTokenAttrs('nano-callout-marker'), calloutMarkerToken(
        tone,
        node.attrs.calloutMarkerSpacing,
        node.attrs.calloutMarkerDepths,
        node.attrs.calloutTextSpacing,
      )],
      ['span', { class: 'nano-block-content' }, 0],
    ]
  },
}

function calloutIcon(tone: CalloutTone) {
  switch (tone) {
    case 'tip':
      return Lightbulb
    case 'important':
      return Diamond
    case 'warning':
    case 'caution':
      return AlertTriangle
    case 'note':
    default:
      return Info
  }
}

function calloutDataAttrs(attrs: Record<string, unknown>): Record<string, string> {
  return {
    ...(encodeQuoteMarkerDepths(attrs.calloutMarkerDepths)
      ? { 'data-callout-marker-depths': encodeQuoteMarkerDepths(attrs.calloutMarkerDepths)! }
      : {}),
    ...(encodeQuoteMarkerSpacing(attrs.calloutMarkerSpacing)
      ? { 'data-callout-marker-spacing': encodeQuoteMarkerSpacing(attrs.calloutMarkerSpacing)! }
      : {}),
    ...(quoteMarkerSpacingValue(attrs.calloutTextSpacing)
      ? { 'data-callout-text-spacing': quoteMarkerSpacingValue(attrs.calloutTextSpacing)! }
      : {}),
  }
}
