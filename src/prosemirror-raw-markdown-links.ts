import { noteLinkParts } from './nano-note-link'
import { externalUrlTokenAt } from './nano-url'

export function rawExternalUrlAt(
  text: string,
  from: number,
): { token: string; href: string; syntax: 'autolink' | 'bare'; to: number } | null {
  return externalUrlTokenAt(text, from)
}

export function rawNoteLinkAt(text: string, from: number): { token: string; target: string; alias?: string; to: number } | null {
  if (!text.startsWith('[[', from)) return null

  const closeFrom = text.indexOf(']]', from + 2)
  if (closeFrom <= from + 2) return null

  const parts = noteLinkParts(text.slice(from + 2, closeFrom))
  if (!parts) return null

  return {
    token: text.slice(from, closeFrom + 2),
    ...parts,
    to: closeFrom + 2,
  }
}

export function rawLinkAt(text: string, from: number): { token: string; label: string; href: string; title?: string; to: number } | null {
  if (text[from] !== '[' || text[from - 1] === '!') return null

  const middle = text.indexOf('](', from + 1)
  if (middle < 0) return null

  const to = text.indexOf(')', middle + 2)
  if (to < 0) return null

  const label = text.slice(from + 1, middle).trim()
  const destination = rawLinkDestination(text.slice(middle + 2, to))
  if (!label || !destination) return null

  return { token: text.slice(from, to + 1), label, ...destination, to: to + 1 }
}

function rawLinkDestination(source: string): { href: string; title?: string } | null {
  const match = /^(\S+)(?:\s+"((?:\\.|[^"\\])*)")?$/.exec(source.trim())
  if (!match) return null

  const href = match[1] ?? ''
  if (!href) return null

  const title = match[2]?.replace(/\\([\\"])/g, '$1')
  return { href, ...(title ? { title } : {}) }
}
