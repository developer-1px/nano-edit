import type { NanoMark } from '../../entities/document/nano-document-model'
import { nanoMarkWithRange, type NanoMarkWithoutRange } from '../../entities/mark/nano-mark-range'
import { inlineMarkdownTokenAt } from './nano-markdown-inline-token'
import {
  boldMarker,
  codeBacktickLength,
  italicMarker,
} from './nano-markdown-inline-utils'

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
    if (from < to) marks.push(nanoMarkWithRange(mark, from, to))
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
      marks.push(nanoMarkWithRange(token.mark, from, text.length))
    } else {
      appendCodeMark(token.content, token.backtickLength)
    }
    index = token.to
  }

  return { text, marks: mergeAdjacentInlineMarks(marks) }
}

function mergeAdjacentInlineMarks(marks: NanoMark[]): NanoMark[] {
  const sorted = marks.sort((left, right) =>
    left.from - right.from || left.to - right.to || left.type.localeCompare(right.type),
  )
  const merged: NanoMark[] = []
  for (const mark of sorted) {
    const previous = merged[merged.length - 1]
    if (previous && sameMark(previous, mark) && previous.to === mark.from) {
      previous.to = mark.to
    } else {
      merged.push({ ...mark })
    }
  }
  return merged
}

function sameMark(left: NanoMark, right: NanoMark): boolean {
  return left.type === right.type
    && (left.type !== 'bold' || right.type !== 'bold' || boldMarker(left.marker) === boldMarker(right.marker))
    && (left.type !== 'italic' || right.type !== 'italic' || italicMarker(left.marker) === italicMarker(right.marker))
    && (left.type !== 'code' || right.type !== 'code' || codeBacktickLength(left.backtickLength) === codeBacktickLength(right.backtickLength))
    && (left.type !== 'link' || right.type !== 'link' || (
      left.href === right.href
      && (left.title ?? '') === (right.title ?? '')
      && (left.syntax ?? '') === (right.syntax ?? '')
      && (left.destinationStyle ?? '') === (right.destinationStyle ?? '')
      && (left.image ?? false) === (right.image ?? false)
      && (left.imageEmptyAlt ?? false) === (right.imageEmptyAlt ?? false)
    ))
    && (left.type !== 'tag' || right.type !== 'tag' || left.name === right.name)
    && (left.type !== 'mention' || right.type !== 'mention' || (left.id === right.id && (left.label ?? '') === (right.label ?? '')))
    && (left.type !== 'note_link' || right.type !== 'note_link' || (left.target === right.target && (left.alias ?? '') === (right.alias ?? '')))
    && (left.type !== 'math' || right.type !== 'math' || left.formula === right.formula)
    && (left.type !== 'footnote_ref' || right.type !== 'footnote_ref' || left.name === right.name)
    && (left.type !== 'source' || right.type !== 'source')
}
