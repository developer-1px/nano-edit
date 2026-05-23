import type { NanoBlock } from './nano-core'
import {
  calloutMarkerDepthAttrs,
  quoteMarkerDepthAttrs,
  quoteMarkerSpacing,
  quoteMarkerSpacingValue,
} from './nano-markdown-block-attrs'
import type { parseInlineMarkdown } from './nano-markdown-inline-parse'
import type { MarkdownTextBlockAttrs } from './nano-markdown-text-block-types'

type InlineMarkdown = ReturnType<typeof parseInlineMarkdown>

export function calloutTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  return {
    id,
    type: 'callout',
    tone: attrs.tone ?? 'note',
    ...(attrs.calloutMarkerSpacing ? { calloutMarkerSpacing: quoteMarkerSpacing(attrs.calloutMarkerSpacing) } : {}),
    ...(attrs.calloutMarkerDepths ? calloutMarkerDepthAttrs(attrs.calloutMarkerDepths) : {}),
    ...(attrs.calloutTextSpacing ? { calloutTextSpacing: quoteMarkerSpacingValue(attrs.calloutTextSpacing, '') } : {}),
    ...inline,
  }
}

export function quoteTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  return {
    id,
    type: 'quote',
    ...(attrs.quoteMarkerSpacing ? { quoteMarkerSpacing: quoteMarkerSpacing(attrs.quoteMarkerSpacing) } : {}),
    ...(attrs.quoteMarkerDepths ? quoteMarkerDepthAttrs(attrs.quoteMarkerDepths) : {}),
    ...inline,
  }
}
