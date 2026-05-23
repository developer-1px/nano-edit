import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { BlockTemplate } from './assembly/capability'
import { sourceBlockId } from './nano-block-option-node-helpers'
import {
  quoteMarkerDepths,
  quoteMarkerSpacing,
  quoteMarkerSpacingValue,
} from './nano-block-option-values'
import { nanoNodeNames, nanoSchema } from './prosemirror-nano'

export function calloutNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): ProseMirrorNode | null {
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
