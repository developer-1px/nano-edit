import type { NanoBlock } from './nano-core'
import { parseInlineMarkdown } from './nano-markdown-inline-parse'
import { nextMarkdownBlockId } from './nano-markdown-state'
import {
  calloutTextBlock,
  quoteTextBlock,
} from './nano-markdown-text-block-quotes'
import { footnoteTextBlock } from './nano-markdown-text-block-footnote'
import { headingTextBlock } from './nano-markdown-text-block-heading'
import {
  listItemTextBlock,
  todoTextBlock,
} from './nano-markdown-text-block-list'
import type {
  MarkdownTextBlockAttrs,
  MarkdownTextBlockType,
} from './nano-markdown-text-block-types'
import type { MarkdownParseState } from './nano-markdown-types'

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
