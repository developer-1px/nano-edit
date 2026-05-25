import type { AnyNanoBlockCodec } from './prosemirror-block-codec-types'
import { codeMathBlockCodecs } from './prosemirror-code-math-block-codecs'
import { footnoteBlockCodec } from './prosemirror-footnote-block-codec'
import { headingBlockCodec } from './prosemirror-heading-block-codec'
import { listItemBlockCodec } from './prosemirror-list-item-block-codec'
import { paragraphBlockCodec } from './prosemirror-paragraph-block-codec'
import { quoteCalloutBlockCodecs } from './prosemirror-quote-callout-block-codecs'
import { todoBlockCodec } from './prosemirror-todo-block-codec'

export { paragraphBlockCodec } from './prosemirror-paragraph-block-codec'

export const nanoTextBlockCodecs: readonly AnyNanoBlockCodec[] = [
  paragraphBlockCodec,
  headingBlockCodec,
  ...quoteCalloutBlockCodecs,
  todoBlockCodec,
  listItemBlockCodec,
  footnoteBlockCodec,
  ...codeMathBlockCodecs,
]
