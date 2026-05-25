import { footnoteRefAt } from '../core/nano-footnote'
import { inlineMathTokenAt } from '../core/nano-math'
import type { MarkShortcutMatch } from './nano-mark-types'
import { noteLinkParts } from '../core/nano-note-link'
import { tagTokenEndingAt } from '../core/nano-tag'

export function bearTagShortcutMatch(source: string): MarkShortcutMatch | null {
  const closed = bearClosedTagShortcutMatch(source)
  if (closed) return closed

  if (!/(?:\s|[.,;:!?()[\]{}"'])$/.test(source)) return null

  const tokenSource = source.slice(0, -1)
  const tag = tagTokenEndingAt(tokenSource)
  if (!tag) return null

  const token = tag.token
  const openFrom = tokenSource.length - token.length
  return {
    openFrom,
    contentFrom: openFrom + 1,
    contentTo: tokenSource.length,
    closeTo: source.length,
    attrs: { name: tag.name },
  }
}

export function bearNoteLinkShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith(']]')) return null

  const contentTo = source.length - 2
  const openFrom = source.lastIndexOf('[[', contentTo - 1)
  if (openFrom < 0) return null

  const contentFrom = openFrom + 2
  const parts = noteLinkParts(source.slice(contentFrom, contentTo))
  if (!parts) return null

  return {
    openFrom,
    contentFrom,
    contentTo,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { ...parts },
  }
}

export function bearMathShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith('$')) return null

  const openFrom = source.lastIndexOf('$', source.length - 2)
  if (openFrom < 0) return null

  const math = inlineMathTokenAt(source, openFrom)
  if (!math || math.to !== source.length) return null

  return {
    openFrom,
    contentFrom: openFrom + 1,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { formula: math.formula },
  }
}

export function bearFootnoteRefShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith(']')) return null

  const openFrom = source.lastIndexOf('[^')
  if (openFrom < 0) return null

  const footnote = footnoteRefAt(source, openFrom)
  if (!footnote || footnote.to !== source.length) return null

  return {
    openFrom,
    contentFrom: openFrom + 2,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { name: footnote.name },
  }
}

function bearClosedTagShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith('#')) return null

  const tag = tagTokenEndingAt(source)
  if (!tag) return null

  return {
    openFrom: tag.from,
    contentFrom: tag.from + 1,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: tag.from,
    markTo: source.length,
    attrs: { name: tag.name },
  }
}
