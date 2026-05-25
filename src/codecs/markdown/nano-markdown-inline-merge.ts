import type { NanoMark } from '../../core/nano-core'
import {
  boldMarker,
  codeBacktickLength,
  italicMarker,
} from './nano-markdown-inline-utils'

export function mergeAdjacentInlineMarks(marks: NanoMark[]): NanoMark[] {
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
    && (left.type !== 'note_link' || right.type !== 'note_link' || (left.target === right.target && (left.alias ?? '') === (right.alias ?? '')))
    && (left.type !== 'math' || right.type !== 'math' || left.formula === right.formula)
    && (left.type !== 'footnote_ref' || right.type !== 'footnote_ref' || left.name === right.name)
    && (left.type !== 'source' || right.type !== 'source')
}
