import type { BlockOption } from './assembly/capability'
import {
  decreaseQuoteAtStartThenParagraph,
  exitEmptyThen,
  quoteMarkerDepth,
  quoteMarkerDepths,
  quoteMarkerSpacing,
  splitBlockContinuingType,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from './prosemirror-nano'

export const quoteBlockOption = {
  id: 'quote',
  label: '“',
  title: 'Quote',
  markdownTrigger: '>',
  template: { type: 'quote' },
  shortcuts: [{
    name: 'quote',
    pattern: /^> $/,
    template: () => ({ type: 'quote', quoteMarkerSpacing: ['space'] }),
  }],
  enterShortcuts: [{
    name: 'quote-line',
    pattern: /^(?!>+ ?\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\])(>+ ?)(.+)$/i,
    template: (match) => ({
      type: 'quote',
      text: match[2] ?? '',
      quoteMarkerDepths: [quoteMarkerDepth(match[1])],
      quoteMarkerSpacing: [String(match[1] ?? '').endsWith(' ') ? 'space' : 'none'],
    }),
  }],
  matchesTemplate: (template) => template.type === 'quote',
  matches: (node) => node.type.name === nanoNodeNames.quote,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.quote],
  attrs: (template, id) => ({
    id,
    quoteMarkerSpacing: template.type === 'quote' ? quoteMarkerSpacing(template.quoteMarkerSpacing) : null,
    quoteMarkerDepths: template.type === 'quote' ? quoteMarkerDepths(template.quoteMarkerDepths) : null,
  }),
  behavior: {
    enter: exitEmptyThen(splitBlockContinuingType),
    backspaceAtStart: decreaseQuoteAtStartThenParagraph,
  },
} satisfies BlockOption
