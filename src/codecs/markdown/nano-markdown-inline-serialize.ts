import type { NanoMark } from '../../core/nano-core'
import {
  escapeMarkdownText,
  transitionMarks,
} from './nano-markdown-inline-output'
import {
  inlineMark,
  type InlineMark,
} from './nano-markdown-inline-mark'

export function inlineMarkdown(text: string, marks: readonly NanoMark[]): string {
  if (!text || marks.length === 0) return escapeMarkdownText(text)

  const inlineMarks = marks
    .map((mark) => inlineMark(mark, text))
    .filter((mark): mark is InlineMark => mark !== null)
    .sort((left, right) => left.priority - right.priority || left.from - right.from || right.to - left.to)
  if (inlineMarks.length === 0) return escapeMarkdownText(text)

  const boundaries = [...new Set([
    0,
    text.length,
    ...inlineMarks.flatMap((mark) => [mark.from, mark.to]),
  ])].sort((left, right) => left - right)

  let markdown = ''
  let active: InlineMark[] = []
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const from = boundaries[index]!
    const to = boundaries[index + 1]!
    const next = inlineMarks.filter((mark) => mark.from <= from && mark.to >= to)
    markdown += transitionMarks(active, next)
    markdown += escapeMarkdownText(
      text.slice(from, to),
      next.some((mark) => mark.key === 'code'),
      next.some((mark) => mark.rawText),
    )
    active = next
  }

  markdown += transitionMarks(active, [])
  return markdown
}
