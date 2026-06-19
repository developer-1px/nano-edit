import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { BlockOption, CalloutTone } from '../../assembly/capability'
import type { BlockTemplate } from '../../assembly/capability'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'
import {
  calloutPattern,
  calloutTone,
  calloutTones,
  quoteMarkerDepth,
  quoteMarkerDepths,
  quoteMarkerSpacing,
  quoteMarkerSpacingValue,
} from '../options/quote-values'
import { decreaseCalloutAtStartThenQuote } from '../options/keyboard-quote-callout'
import { exitEmptyThen } from '../../capabilities/block-behavior-paragraph'
import { splitCalloutBlock } from '../options/keyboard-split'
import { sourceBlockId } from '../options/node-helpers'

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

function calloutNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): ProseMirrorNode | null {
  if (template.type !== 'callout') return null

  const id = sourceBlockId(source, 'callout')
  const content = typeof template.text === 'string'
    ? template.text ? nanoSchema.text(template.text) : null
    : typeof source === 'string'
      ? null
      : source.isTextblock ? source.content : null
  return nanoSchema.nodes[nanoNodeNames.callout].create(
    {
      id,
      tone: template.tone,
      calloutMarkerDepths: quoteMarkerDepths(template.calloutMarkerDepths)
        ?? (typeof source === 'string' ? null : quoteMarkerDepths(source.attrs.calloutMarkerDepths)),
      calloutMarkerSpacing: quoteMarkerSpacing(template.calloutMarkerSpacing)
        ?? (typeof source === 'string' ? null : quoteMarkerSpacing(source.attrs.calloutMarkerSpacing)),
      calloutTextSpacing: quoteMarkerSpacingValue(template.calloutTextSpacing)
        ?? (typeof source === 'string' ? null : quoteMarkerSpacingValue(source.attrs.calloutTextSpacing)),
    },
    content,
  )
}
