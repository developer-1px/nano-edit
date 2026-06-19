import type { NanoBlock } from '../../entities/document/nano-document-model'
import {
  listContinuationIndentAttrs,
  markdownIndentColumns,
} from './nano-markdown-list-attrs'
import { markdownListLine } from './nano-markdown-list-line'
import { textBlock } from './nano-markdown-text-block'
import type {
  ListContinuationIndent,
  MarkdownParseState,
} from './nano-markdown-types'

export function parseListBlock(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const first = markdownListLine(lines[index] ?? '')
  if (!first) return null

  const text = [first.text]
  const continuationIndents: ListContinuationIndent[] = []
  let nextIndex = index + 1

  while (nextIndex < lines.length) {
    const continuation = listContinuationLine(lines[nextIndex] ?? '', first.indentText)
    if (!continuation) break

    continuationIndents.push(continuation.indent)
    text.push(continuation.text)
    nextIndex += 1
  }

  const attrs = {
    ...first.attrs,
    ...listContinuationIndentAttrs(continuationIndents, first.defaultContinuationIndent),
  }

  return {
    block: first.type === 'todo'
      ? textBlock('todo', text.join('\n'), state, attrs)
      : textBlock('list_item', text.join('\n'), state, attrs),
    nextIndex,
  }
}

function listContinuationLine(
  line: string,
  parentIndentText: string,
): { indent: ListContinuationIndent; text: string } | null {
  if (line.trim() === '' || markdownListLine(line)) return null

  const match = /^([\t ]+)(.*)$/.exec(line)
  if (!match) return null

  const indent = match[1] ?? ''
  if (markdownIndentColumns(indent) <= markdownIndentColumns(parentIndentText)) return null
  return { indent, text: match[2] ?? '' }
}
