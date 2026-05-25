import type { NanoBlock } from '../../core/nano-core'
import {
  atxClosingLength,
  atxSpacing,
  setextLength,
  setextMarker,
} from './nano-markdown-block-attrs'
import type { parseInlineMarkdown } from './nano-markdown-inline-parse'
import type { MarkdownTextBlockAttrs } from './nano-markdown-text-block-types'

type InlineMarkdown = ReturnType<typeof parseInlineMarkdown>

export function headingTextBlock(
  id: string,
  attrs: MarkdownTextBlockAttrs,
  inline: InlineMarkdown,
): NanoBlock {
  return {
    id,
    type: 'heading',
    level: attrs.level ?? 1,
    ...(attrs.headingStyle === 'setext' ? { headingStyle: 'setext' as const } : {}),
    ...(attrs.headingStyle !== 'setext' && attrs.atxClosingLength ? { atxClosingLength: atxClosingLength(attrs.atxClosingLength) } : {}),
    ...(attrs.headingStyle !== 'setext' && attrs.atxClosingSpacing && atxSpacing(attrs.atxClosingSpacing) !== 1 ? { atxClosingSpacing: atxSpacing(attrs.atxClosingSpacing) } : {}),
    ...(attrs.headingStyle !== 'setext' && attrs.atxTextSpacing && atxSpacing(attrs.atxTextSpacing) !== 1 ? { atxTextSpacing: atxSpacing(attrs.atxTextSpacing) } : {}),
    ...(attrs.headingStyle === 'setext' ? { setextMarker: setextMarker(attrs.setextMarker, attrs.level) } : {}),
    ...(attrs.headingStyle === 'setext' && attrs.setextLength ? { setextLength: setextLength(attrs.setextLength) } : {}),
    ...inline,
  }
}
