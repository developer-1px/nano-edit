import type { NodeSpec } from 'prosemirror-model'
import {
  atxClosingLengthOrNull,
  atxSpacing,
  clampHeadingLevel,
  headingPrefixToken,
  headingStyle,
  headingSuffixDomSpec,
  setextLength,
  setextMarker,
} from './prosemirror-block-attrs'
import { foldIndicatorDomSpec } from './nano-fold-indicator'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'

export const paragraphNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: { id: { default: null } },
  parseDOM: [{ tag: 'p.nano-paragraph' }],
  toDOM: (node) => ['p', { class: 'nano-block nano-paragraph', 'data-id': node.attrs.id }, 0],
}

export const headingNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  defining: true,
  attrs: {
    id: { default: null },
    level: { default: 1 },
    headingStyle: { default: 'atx' },
    atxClosingLength: { default: null },
    atxClosingSpacing: { default: null },
    atxTextSpacing: { default: null },
    setextMarker: { default: null },
    setextLength: { default: null },
  },
  parseDOM: [
    { tag: 'h1', attrs: { level: 1 } },
    { tag: 'h2', attrs: { level: 2 } },
    { tag: 'h3', attrs: { level: 3 } },
    { tag: 'h4', attrs: { level: 4 } },
    { tag: 'h5', attrs: { level: 5 } },
    { tag: 'h6', attrs: { level: 6 } },
  ],
  toDOM: (node) => [
    `h${clampHeadingLevel(node.attrs.level)}`,
    {
      class: `nano-block nano-heading nano-heading-${clampHeadingLevel(node.attrs.level)}`,
      'data-id': node.attrs.id,
      'data-heading-style': headingStyle(node.attrs.headingStyle, node.attrs.level),
      ...headingAtxDataAttrs(node.attrs),
      ...headingSetextDataAttrs(node.attrs),
    },
    foldIndicatorDomSpec('nano-heading-fold'),
    ['span', hiddenSourceTokenAttrs('nano-block-md-prefix'), headingPrefixToken(node.attrs.headingStyle, node.attrs.level, node.attrs.atxTextSpacing)],
    ['span', { class: 'nano-block-content' }, 0],
    ...headingSuffixDomSpec(
      node.attrs.headingStyle,
      node.attrs.level,
      node.attrs.atxClosingLength,
      node.attrs.atxClosingSpacing,
      node.attrs.setextMarker,
      node.attrs.setextLength,
    ),
  ],
}

function headingAtxDataAttrs(attrs: Record<string, unknown>): Record<string, string> {
  if (headingStyle(attrs.headingStyle, attrs.level) !== 'atx') return {}
  return {
    ...(atxClosingLengthOrNull(attrs.atxClosingLength)
      ? { 'data-atx-closing-length': String(atxClosingLengthOrNull(attrs.atxClosingLength)) }
      : {}),
    ...(atxSpacing(attrs.atxClosingSpacing) !== 1
      ? { 'data-atx-closing-spacing': String(atxSpacing(attrs.atxClosingSpacing)) }
      : {}),
    ...(atxSpacing(attrs.atxTextSpacing) !== 1
      ? { 'data-atx-text-spacing': String(atxSpacing(attrs.atxTextSpacing)) }
      : {}),
  }
}

function headingSetextDataAttrs(attrs: Record<string, unknown>): Record<string, string> {
  return headingStyle(attrs.headingStyle, attrs.level) === 'setext'
    ? {
        'data-setext-marker': setextMarker(attrs.setextMarker, attrs.level),
        'data-setext-length': String(setextLength(attrs.setextLength)),
      }
    : {}
}
