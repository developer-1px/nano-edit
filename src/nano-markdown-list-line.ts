import { markdownTodoLine } from './capabilities/todo/markdown'
import {
  bulletMarker,
  markdownIndentLevel,
  markdownIndentText,
  markdownOrderedStart,
  orderedMarker,
  orderedStartText,
} from './nano-markdown-block-attrs'
import type {
  BulletMarker,
  CheckedMarker,
  ListContinuationIndent,
  OrderedMarker,
} from './nano-markdown-types'

export function markdownListLine(line: string): {
  attrs:
    | { checked: boolean; indent?: number; indentText?: string; marker?: BulletMarker; checkedMarker?: CheckedMarker }
    | { kind: 'bullet' | 'ordered'; indent?: number; indentText?: string; marker?: BulletMarker; orderedMarker?: OrderedMarker; orderedStartText?: string; start?: number | null }
  defaultContinuationIndent: ListContinuationIndent
  indentText: string
  text: string
  type: 'todo' | 'list_item'
} | null {
  const todo = markdownTodoLine(line)
  if (todo) return todo

  const bullet = /^([ \t]*)([-*+])(?:\s+(.*))?$/.exec(line)
  if (bullet) {
    const indent = bullet[1] ?? ''
    const marker = bulletMarker(bullet[2])
    return {
      type: 'list_item',
      text: bullet[3] ?? '',
      indentText: indent,
      defaultContinuationIndent: `${indent}${' '.repeat(`${marker} `.length)}`,
      attrs: {
        kind: 'bullet',
        indent: markdownIndentLevel(indent),
        indentText: markdownIndentText(indent),
        marker,
      },
    }
  }

  const ordered = /^([ \t]*)(\d+)([.)])(?:\s+(.*))?$/.exec(line)
  if (!ordered) return null

  const indent = ordered[1] ?? ''
  const startText = ordered[2] ?? '1'
  const marker = orderedMarker(ordered[3])
  return {
    type: 'list_item',
    text: ordered[4] ?? '',
    indentText: indent,
    defaultContinuationIndent: `${indent}${' '.repeat(`${startText}${marker} `.length)}`,
    attrs: {
      kind: 'ordered',
      indent: markdownIndentLevel(indent),
      indentText: markdownIndentText(indent),
      start: markdownOrderedStart(startText),
      orderedStartText: orderedStartText(startText),
      orderedMarker: marker,
    },
  }
}
