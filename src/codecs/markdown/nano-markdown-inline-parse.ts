import type { NanoMark } from '../../core/nano-core'
import { mergeAdjacentInlineMarks } from './nano-markdown-inline-merge'
import {
  inlineMarkdownTokenAt,
  type NanoMarkWithoutRange,
} from './nano-markdown-inline-token'

interface InlineParseResult {
  text: string
  marks: NanoMark[]
}

export function parseInlineMarkdown(source: string): InlineParseResult {
  let text = ''
  const marks: NanoMark[] = []
  let index = 0

  const appendText = (value: string) => {
    text += value
  }
  const appendParsedMark = (content: string, mark: NanoMarkWithoutRange) => {
    const from = text.length
    const parsed = parseInlineMarkdown(content)
    text += parsed.text
    marks.push(...parsed.marks.map((nested) => ({
      ...nested,
      from: nested.from + from,
      to: nested.to + from,
    })))
    const to = text.length
    if (from < to) marks.push({ ...mark, from, to } as NanoMark)
  }
  const appendCodeMark = (content: string, backtickLength: number) => {
    const from = text.length
    text += content
    const to = text.length
    if (from < to) {
      marks.push({
        type: 'code',
        from,
        to,
        ...(backtickLength > 1 ? { backtickLength } : {}),
      })
    }
  }

  while (index < source.length) {
    const token = inlineMarkdownTokenAt(source, index)
    if (token.kind === 'text') {
      appendText(token.text)
    } else if (token.kind === 'parsedMark') {
      appendParsedMark(token.content, token.mark)
    } else if (token.kind === 'literalMark') {
      const from = text.length
      appendText(token.token)
      marks.push({ ...token.mark, from, to: text.length } as NanoMark)
    } else {
      appendCodeMark(token.content, token.backtickLength)
    }
    index = token.to
  }

  return { text, marks: mergeAdjacentInlineMarks(marks) }
}
