import type { NanoBlock } from '../../entities/document/nano-document-model'
import {
  atxClosingLength,
  atxSpacing,
  setextLength,
  setextMarker,
} from './nano-markdown-heading-attrs'
import { footnoteContinuationIndentAttrs } from './nano-markdown-footnote-attrs'
import { parseInlineMarkdown } from './nano-markdown-inline-parse'
import { clampIndent } from './nano-markdown-list-attrs'
import {
  calloutMarkerDepthAttrs,
  quoteMarkerDepthAttrs,
  quoteMarkerSpacing,
  quoteMarkerSpacingValue,
} from './nano-markdown-quote-attrs'
import { nextMarkdownBlockId } from './nano-markdown-state'
import type {
  BulletMarker,
  CalloutTone,
  CheckedMarker,
  FootnoteContinuationIndent,
  FootnoteTextSpacing,
  HeadingStyle,
  ListContinuationIndent,
  MarkdownParseState,
  OrderedMarker,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
  SetextMarker,
} from './nano-markdown-types'

type MarkdownTextBlockType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'callout'
  | 'todo'
  | 'list_item'
  | 'footnote'

interface MarkdownTextBlockAttrs {
  atxClosingLength?: number
  atxClosingSpacing?: number
  atxTextSpacing?: number
  calloutMarkerDepths?: QuoteMarkerDepth[]
  calloutMarkerSpacing?: QuoteMarkerSpacing[]
  calloutTextSpacing?: QuoteMarkerSpacing
  checked?: boolean
  checkedMarker?: CheckedMarker
  continuationIndents?: ListContinuationIndent[]
  footnoteContinuationIndents?: FootnoteContinuationIndent[]
  footnoteTextSpacing?: FootnoteTextSpacing
  headingStyle?: HeadingStyle
  indent?: number
  indentText?: string
  kind?: 'bullet' | 'ordered'
  level?: number
  marker?: BulletMarker
  name?: string
  orderedMarker?: OrderedMarker
  orderedStartText?: string
  quoteMarkerDepths?: QuoteMarkerDepth[]
  quoteMarkerSpacing?: QuoteMarkerSpacing[]
  setextLength?: number
  setextMarker?: SetextMarker
  start?: number | null
  tone?: CalloutTone
}

export function textBlock(
  type: MarkdownTextBlockType,
  source: string,
  state: MarkdownParseState,
  attrs: MarkdownTextBlockAttrs = {},
): NanoBlock {
  const inline = parseInlineMarkdown(source)
  const id = nextMarkdownBlockId(state)
  switch (type) {
    case 'heading':
      return headingTextBlock(id, attrs, inline)
    case 'callout':
      return calloutTextBlock(id, attrs, inline)
    case 'todo':
      return todoTextBlock(id, attrs, inline)
    case 'footnote':
      return footnoteTextBlock(id, attrs, inline)
    case 'list_item':
      return listItemTextBlock(id, attrs, inline)
    case 'quote':
      return quoteTextBlock(id, attrs, inline)
    case 'paragraph':
      return { id, type, ...inline }
  }
}

type InlineMarkdown = ReturnType<typeof parseInlineMarkdown>
type HeadingBlock = Extract<NanoBlock, { type: 'heading' }>
type FootnoteBlock = Extract<NanoBlock, { type: 'footnote' }>

function headingTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  const block: HeadingBlock = {
    id,
    type: 'heading',
    level: attrs.level ?? 1,
    ...inline,
  }
  if (attrs.headingStyle === 'setext') {
    block.headingStyle = 'setext'
    block.setextMarker = setextMarker(attrs.setextMarker, attrs.level)
    if (attrs.setextLength) block.setextLength = setextLength(attrs.setextLength)
    return block
  }

  if (attrs.atxClosingLength) block.atxClosingLength = atxClosingLength(attrs.atxClosingLength)
  if (attrs.atxClosingSpacing && atxSpacing(attrs.atxClosingSpacing) !== 1) {
    block.atxClosingSpacing = atxSpacing(attrs.atxClosingSpacing)
  }
  if (attrs.atxTextSpacing && atxSpacing(attrs.atxTextSpacing) !== 1) {
    block.atxTextSpacing = atxSpacing(attrs.atxTextSpacing)
  }
  return block
}

function calloutTextBlock(
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

function todoTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  return {
    id,
    type: 'todo',
    checked: attrs.checked === true,
    ...(attrs.continuationIndents ? { continuationIndents: attrs.continuationIndents } : {}),
    indent: clampIndent(attrs.indent),
    ...(attrs.indentText ? { indentText: attrs.indentText } : {}),
    ...(attrs.marker && attrs.marker !== '-' ? { marker: attrs.marker } : {}),
    ...(attrs.checked === true && attrs.checkedMarker && attrs.checkedMarker !== 'x' ? { checkedMarker: attrs.checkedMarker } : {}),
    ...inline,
  }
}

function footnoteTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  const block: FootnoteBlock = {
    id,
    type: 'footnote',
    name: attrs.name ?? '1',
    ...inline,
  }
  if (attrs.footnoteContinuationIndents) {
    Object.assign(block, footnoteContinuationIndentAttrs(attrs.footnoteContinuationIndents))
  }
  if (attrs.footnoteTextSpacing === 'none') block.footnoteTextSpacing = 'none'
  return block
}

function listItemTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  return {
    id,
    type: 'list_item',
    kind: attrs.kind ?? 'bullet',
    ...(attrs.continuationIndents ? { continuationIndents: attrs.continuationIndents } : {}),
    indent: clampIndent(attrs.indent),
    ...(attrs.indentText ? { indentText: attrs.indentText } : {}),
    ...(attrs.kind === 'ordered' && attrs.start ? { start: attrs.start } : {}),
    ...(attrs.kind === 'ordered' && attrs.orderedStartText ? { orderedStartText: attrs.orderedStartText } : {}),
    ...(attrs.kind === 'bullet' && attrs.marker && attrs.marker !== '-' ? { marker: attrs.marker } : {}),
    ...(attrs.kind === 'ordered' && attrs.orderedMarker && attrs.orderedMarker !== '.' ? { orderedMarker: attrs.orderedMarker } : {}),
    ...inline,
  }
}

function quoteTextBlock(
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
