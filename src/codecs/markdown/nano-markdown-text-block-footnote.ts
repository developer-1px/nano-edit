import type { NanoBlock } from '../../core/nano-core'
import { footnoteContinuationIndentAttrs } from './nano-markdown-block-attrs'
import type { parseInlineMarkdown } from './nano-markdown-inline-parse'
import type { MarkdownTextBlockAttrs } from './nano-markdown-text-block-types'

type InlineMarkdown = ReturnType<typeof parseInlineMarkdown>

export function footnoteTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  return {
    id,
    type: 'footnote',
    name: attrs.name ?? '1',
    ...(attrs.footnoteContinuationIndents ? footnoteContinuationIndentAttrs(attrs.footnoteContinuationIndents) : {}),
    ...(attrs.footnoteTextSpacing === 'none' ? { footnoteTextSpacing: 'none' as const } : {}),
    ...inline,
  }
}
