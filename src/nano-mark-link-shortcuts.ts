import { externalUrlTokenAt, externalUrlTokenEndingAt } from './nano-url'
import type { MarkShortcutMatch } from './nano-mark-types'

export function markdownLinkShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith(')')) return null

  const closeTo = source.length
  const linkMiddle = source.lastIndexOf('](', closeTo - 1)
  if (linkMiddle < 0) return null

  const openFrom = source.lastIndexOf('[', linkMiddle - 1)
  if (openFrom < 0) return null
  if (openFrom > 0 && source[openFrom - 1] === '!') return null

  const contentFrom = openFrom + 1
  const contentTo = linkMiddle
  const destination = markdownLinkDestination(source.slice(linkMiddle + 2, closeTo - 1))
  if (contentFrom >= contentTo) return null
  if (source.slice(contentFrom, contentTo).trim().length === 0) return null
  if (!destination) return null

  return { openFrom, contentFrom, contentTo, closeTo, attrs: destination }
}

export function externalAutolinkShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith('>')) return null

  const openFrom = source.lastIndexOf('<')
  if (openFrom < 0) return null

  const token = externalUrlTokenAt(source, openFrom)
  if (!token || token.syntax !== 'autolink' || token.to !== source.length) return null

  return {
    openFrom,
    contentFrom: openFrom + 1,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { href: token.href, syntax: token.syntax },
  }
}

export function externalBareUrlShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!/(?:\s|[.,;:!?])$/.test(source)) return null

  const tokenSource = source.slice(0, -1)
  const token = externalUrlTokenEndingAt(tokenSource)
  if (!token || token.syntax !== 'bare') return null

  return {
    openFrom: token.from,
    contentFrom: token.from,
    contentTo: token.to,
    closeTo: source.length,
    markFrom: token.from,
    markTo: token.to,
    attrs: { href: token.href, syntax: token.syntax },
  }
}

function markdownLinkDestination(source: string): { href: string; title?: string } | null {
  const match = /^(\S+)(?:\s+"((?:\\.|[^"\\])*)")?$/.exec(source.trim())
  if (!match) return null

  const href = match[1] ?? ''
  if (!href) return null

  const title = match[2]?.replace(/\\([\\"])/g, '$1')
  return { href, ...(title ? { title } : {}) }
}
