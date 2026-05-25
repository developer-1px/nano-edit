import {
  isBackslashEscaped,
  needsAngleMarkdownDestination,
  unescapeMarkdownImageTitle,
  unescapeMarkdownLinkDestination,
} from './nano-markdown-link-escape'

export function markdownLinkDestination(source: string): { href: string; destinationStyle?: 'angle'; title?: string } | null {
  const trimmed = source.trim()
  const title = markdownLinkTitle(trimmed)
  const destinationSource = title ? trimmed.slice(0, title.from).trim() : trimmed
  const href = markdownLinkHref(destinationSource)
  if (!href) return null

  return {
    href,
    ...(usesExplicitAngleDestination(destinationSource, href) ? { destinationStyle: 'angle' as const } : {}),
    ...(title?.text ? { title: title.text } : {}),
  }
}

export function markdownLinkLabelClose(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === '\\') {
      index += 1
      continue
    }
    if (source[index] === ']') return index
  }
  return -1
}

export function markdownLinkDestinationClose(source: string, from: number): number {
  let depth = 0
  let escaped = false
  let inAngleDestination = false
  let inTitle = false

  for (let index = from; index < source.length; index += 1) {
    const char = source[index]!
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (inAngleDestination) {
      if (char === '>') inAngleDestination = false
      continue
    }
    if (char === '<') {
      inAngleDestination = true
      continue
    }
    if (char === '"') {
      inTitle = !inTitle
      continue
    }
    if (inTitle) continue
    if (char === '(') {
      depth += 1
      continue
    }
    if (char === ')') {
      if (depth > 0) {
        depth -= 1
        continue
      }
      if (markdownLinkDestination(source.slice(from, index))) return index
    }
  }

  return -1
}

function markdownLinkTitle(source: string): { from: number; text: string } | null {
  let end = source.length
  while (end > 0 && /[ \t]/.test(source[end - 1]!)) end -= 1
  if (source[end - 1] !== '"') return null

  for (let index = end - 2; index >= 0; index -= 1) {
    if (source[index] !== '"' || isBackslashEscaped(source, index)) continue
    if (index === 0 || !/[ \t]/.test(source[index - 1]!)) return null
    return { from: index, text: unescapeMarkdownImageTitle(source.slice(index + 1, end - 1)) }
  }

  return null
}

function markdownLinkHref(source: string): string | null {
  if (!source) return null
  if (source.startsWith('<') || source.endsWith('>')) {
    if (!source.startsWith('<') || !source.endsWith('>')) return null
    const href = unescapeMarkdownLinkDestination(source.slice(1, -1))
    return href && !/[\r\n]/.test(href) ? href : null
  }

  return /\s/.test(source) ? null : unescapeMarkdownLinkDestination(source)
}

function usesExplicitAngleDestination(source: string, href: string): boolean {
  return source.startsWith('<') && source.endsWith('>') && !needsAngleMarkdownDestination(href)
}
