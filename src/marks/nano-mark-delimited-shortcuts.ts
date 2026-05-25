import type { MarkShortcut, MarkShortcutMatch } from './nano-mark-types'

export function markShortcutMatch(
  source: string,
  shortcut: MarkShortcut,
): MarkShortcutMatch | null {
  if (!shortcut.open) return null

  const close = shortcut.close ?? shortcut.open
  if (!source.endsWith(close)) return null

  const contentTo = source.length - close.length
  const openFrom = source.lastIndexOf(shortcut.open, contentTo - 1)
  if (openFrom < 0) return null

  const contentFrom = openFrom + shortcut.open.length
  if (contentFrom >= contentTo) return null
  if (source.slice(contentFrom, contentTo).trim().length === 0) return null
  if (shortcut.open.length === 1 && openFrom > 0 && source[openFrom - 1] === shortcut.open) return null

  return { openFrom, contentFrom, contentTo, closeTo: source.length }
}

export function codeSpanShortcutMatch(source: string): MarkShortcutMatch | null {
  const backtickLength = trailingBacktickRunLength(source)
  if (backtickLength === 0) return null

  const closeFrom = source.length - backtickLength
  const openFrom = findMatchingBacktickRun(source, closeFrom, backtickLength)
  if (openFrom < 0) return null

  const contentFrom = openFrom + backtickLength
  if (contentFrom >= closeFrom) return null
  if (source.slice(contentFrom, closeFrom).trim().length === 0) return null

  return {
    openFrom,
    contentFrom,
    contentTo: closeFrom,
    closeTo: source.length,
    ...(backtickLength > 1 ? { attrs: { backtickLength } } : {}),
  }
}

function trailingBacktickRunLength(source: string): number {
  let index = source.length - 1
  while (source[index] === '`') index -= 1
  return source.length - index - 1
}

function findMatchingBacktickRun(source: string, before: number, length: number): number {
  const token = '`'.repeat(length)
  let index = source.lastIndexOf(token, before - 1)
  while (index >= 0) {
    if (backtickRunLength(source, index) === length) return index
    index = source.lastIndexOf(token, index - 1)
  }
  return -1
}

function backtickRunLength(source: string, from: number): number {
  let index = from
  while (source[index] === '`') index += 1
  return index - from
}
