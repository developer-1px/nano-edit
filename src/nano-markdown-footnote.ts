import type { NanoBlock } from './nano-core'
import { footnoteDefinition } from './nano-footnote'
import {
  footnoteContinuationIndent,
  footnoteContinuationIndentAttrs,
} from './nano-markdown-block-attrs'
import { inlineMarkdown } from './nano-markdown-inline-serialize'
import { textBlock } from './nano-markdown-text-block'
import type {
  FootnoteContinuationIndent,
  MarkdownParseState,
} from './nano-markdown-types'

export function parseFootnoteBlock(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const footnote = footnoteDefinition(lines[index] ?? '')
  if (!footnote) return null

  const text = [footnote.text]
  const continuationIndents: FootnoteContinuationIndent[] = []
  let nextIndex = index + 1

  while (nextIndex < lines.length) {
    const continuation = footnoteContinuationLine(lines[nextIndex]!)
    if (!continuation) break

    continuationIndents.push(continuation.indent)
    text.push(continuation.text)
    nextIndex += 1
  }

  return {
    block: textBlock('footnote', text.join('\n'), state, {
      name: footnote.name,
      footnoteTextSpacing: footnote.textSpacing,
      ...footnoteContinuationIndentAttrs(continuationIndents),
    }),
    nextIndex,
  }
}

export function parseFootnoteLine(line: string, state: MarkdownParseState): NanoBlock | null {
  const footnote = footnoteDefinition(line)
  return footnote
    ? textBlock('footnote', footnote.text, state, { name: footnote.name, footnoteTextSpacing: footnote.textSpacing })
    : null
}

export function markdownFootnote(block: Extract<NanoBlock, { type: 'footnote' }>): string {
  const marker = `[^${block.name}]:`
  const lines = inlineMarkdown(block.text, block.marks).split('\n')
  const firstLine = lines[0] ?? ''
  if (!firstLine && lines.length === 1) return marker

  return [
    firstLine ? `${marker}${footnoteTextSpacing(block.footnoteTextSpacing)}${firstLine}` : marker,
    ...lines.slice(1).map((line, index) => `${footnoteContinuationIndent(block.footnoteContinuationIndents?.[index])}${line}`),
  ].join('\n')
}

function footnoteContinuationLine(line: string): { indent: FootnoteContinuationIndent; text: string } | null {
  const match = /^((?: {4,})|\t)(.*)$/.exec(line)
  return match ? { indent: match[1]!, text: match[2] ?? '' } : null
}

function footnoteTextSpacing(spacing: unknown): ' ' | '' {
  return spacing === 'none' ? '' : ' '
}
