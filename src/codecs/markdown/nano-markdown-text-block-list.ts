import type { NanoBlock } from '../../core/nano-core'
import { clampIndent } from './nano-markdown-block-attrs'
import type { parseInlineMarkdown } from './nano-markdown-inline-parse'
import type { MarkdownTextBlockAttrs } from './nano-markdown-text-block-types'

type InlineMarkdown = ReturnType<typeof parseInlineMarkdown>

export function todoTextBlock(
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

export function listItemTextBlock(
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
