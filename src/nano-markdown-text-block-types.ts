import type {
  BulletMarker,
  CalloutTone,
  CheckedMarker,
  FootnoteContinuationIndent,
  FootnoteTextSpacing,
  HeadingStyle,
  ListContinuationIndent,
  OrderedMarker,
  QuoteMarkerDepth,
  QuoteMarkerSpacing,
  SetextMarker,
} from './nano-markdown-types'

export type MarkdownTextBlockType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'callout'
  | 'todo'
  | 'list_item'
  | 'footnote'

export interface MarkdownTextBlockAttrs {
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
