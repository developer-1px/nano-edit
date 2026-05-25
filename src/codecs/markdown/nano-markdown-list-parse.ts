import type { NanoBlock } from '../../core/nano-core'
import {
  listContinuationIndentAttrs,
  markdownIndentColumns,
} from './nano-markdown-block-attrs'
import { markdownListLine } from './nano-markdown-list-line'
import { textBlock } from './nano-markdown-text-block'
import type {
  BulletMarker,
  CheckedMarker,
  ListContinuationIndent,
  MarkdownParseState,
  OrderedMarker,
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
    const continuation = listContinuationLine(lines[nextIndex]!, first.indentText)
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
      ? textBlock('todo', text.join('\n'), state, attrs as { checked: boolean; continuationIndents?: ListContinuationIndent[]; indent?: number; indentText?: string; marker?: BulletMarker; checkedMarker?: CheckedMarker })
      : textBlock('list_item', text.join('\n'), state, attrs as { kind: 'bullet' | 'ordered'; continuationIndents?: ListContinuationIndent[]; indent?: number; indentText?: string; marker?: BulletMarker; orderedMarker?: OrderedMarker; orderedStartText?: string; start?: number | null }),
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

  const indent = match[1]!
  if (markdownIndentColumns(indent) <= markdownIndentColumns(parentIndentText)) return null
  return { indent, text: match[2] ?? '' }
}
