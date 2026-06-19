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
} from './prosemirror-heading-attrs'
import { foldIndicatorDomSpec } from '../../view/block-ui/fold-indicator'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'
import {
  textDirectionAttrs,
  textDirectionFromElement,
} from './prosemirror-text-direction'

export const paragraphNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: { id: { default: null }, textDirection: { default: null } },
  parseDOM: [{
    tag: 'p.nano-paragraph',
    getAttrs: (dom) => {
      const element = dom instanceof HTMLElement ? dom : null
      return element ? { textDirection: textDirectionFromElement(element) } : false
    },
  }],
  toDOM: (node) => ['p', {
    class: 'nano-block nano-paragraph',
    'data-id': node.attrs.id,
    ...textDirectionAttrs(node.attrs.textDirection),
  }, 0],
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
    textDirection: { default: null },
  },
  parseDOM: [
    headingParseRule('h1', 1),
    headingParseRule('h2', 2),
    headingParseRule('h3', 3),
    headingParseRule('h4', 4),
    headingParseRule('h5', 5),
    headingParseRule('h6', 6),
  ],
  toDOM: (node) => [
    `h${clampHeadingLevel(node.attrs.level)}`,
    {
      class: `nano-block nano-heading nano-heading-${clampHeadingLevel(node.attrs.level)}`,
      'data-id': node.attrs.id,
      'data-heading-style': headingStyle(node.attrs.headingStyle, node.attrs.level),
      ...headingAtxDataAttrs(node.attrs),
      ...headingSetextDataAttrs(node.attrs),
      ...textDirectionAttrs(node.attrs.textDirection),
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

function headingParseRule(tag: string, level: number) {
  return {
    tag,
    getAttrs: (dom: HTMLElement | string) => {
      const element = dom instanceof HTMLElement ? dom : null
      return {
        level,
        textDirection: element ? textDirectionFromElement(element) : null,
      }
    },
  }
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
