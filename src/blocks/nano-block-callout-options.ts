import type { BlockOption, CalloutTone } from '../assembly/capability'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'
import {
  calloutPattern,
  calloutTone,
  calloutTones,
  quoteMarkerDepth,
  quoteMarkerDepths,
  quoteMarkerSpacing,
  quoteMarkerSpacingValue,
} from './nano-block-option-values'
import {
  decreaseCalloutAtStartThenQuote,
  exitEmptyThen,
  splitCalloutBlock,
} from './nano-block-option-keyboard'
import { calloutNodeForBlockTemplate } from './nano-block-option-nodes'

export const calloutBlockOptions = calloutTones.map((tone) => calloutBlockOption(tone))

function calloutBlockOption(tone: CalloutTone): BlockOption {
  const marker = `> [!${tone.toUpperCase()}]`
  return {
    id: `callout-${tone}`,
    label: calloutLabel(tone),
    title: `Callout ${tone}`,
    markdownTrigger: marker,
    template: { type: 'callout', tone },
    shortcuts: tone === 'note'
      ? [{
          name: 'callout',
          pattern: new RegExp(`^(>+)( ?)\\[!${calloutPattern}\\] $`, 'i'),
          template: (match) => ({
            type: 'callout',
            tone: calloutTone(match[3]),
            calloutMarkerDepths: [quoteMarkerDepth(match[1])],
            calloutMarkerSpacing: [match[2] === ' ' ? 'space' : 'none'],
            calloutTextSpacing: 'space',
          }),
        }]
      : undefined,
    enterShortcuts: tone === 'note'
      ? [{
          name: 'callout',
          pattern: new RegExp(`^(>+)( ?)\\[!${calloutPattern}\\]( ?)(.*)$`, 'i'),
          template: (match) => ({
            type: 'callout',
            tone: calloutTone(match[3]),
            text: match[5] ?? '',
            calloutMarkerDepths: [quoteMarkerDepth(match[1])],
            calloutMarkerSpacing: [match[2] === ' ' ? 'space' : 'none'],
            calloutTextSpacing: match[4] === ' ' ? 'space' : 'none',
          }),
        }]
      : undefined,
    matchesTemplate: (template) => template.type === 'callout' && template.tone === tone,
    matches: (node) => node.type.name === nanoNodeNames.callout && calloutTone(node.attrs.tone) === tone,
    nodeType: () => nanoSchema.nodes[nanoNodeNames.callout],
    attrs: (template, id) => ({
      id,
      tone: template.type === 'callout' ? template.tone : tone,
      calloutMarkerDepths: template.type === 'callout' ? quoteMarkerDepths(template.calloutMarkerDepths) : null,
      calloutMarkerSpacing: template.type === 'callout' ? quoteMarkerSpacing(template.calloutMarkerSpacing) : null,
      calloutTextSpacing: template.type === 'callout' ? quoteMarkerSpacingValue(template.calloutTextSpacing) : null,
    }),
    behavior: {
      enter: exitEmptyThen(splitCalloutBlock),
      backspaceAtStart: decreaseCalloutAtStartThenQuote,
    },
    insertedNode: calloutNodeForBlockTemplate,
    replacementNode: calloutNodeForBlockTemplate,
  }
}

function calloutLabel(tone: CalloutTone): string {
  switch (tone) {
    case 'note':
      return '!'
    case 'tip':
      return 'Tip'
    case 'important':
      return 'Imp'
    case 'warning':
      return 'Warn'
    case 'caution':
      return 'Caut'
  }
}
