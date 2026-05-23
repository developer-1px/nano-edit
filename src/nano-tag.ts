export interface TagToken {
  token: string
  name: string
  from: number
  to: number
}

export function tagHierarchyLabels(source: string): string[] {
  const tag = normalizeTagName(source)
  if (!tag) return []

  const parts = tag.split('/').filter(Boolean)
  return parts
    .map((_part, index) => tagLabel(parts.slice(0, index + 1).join('/')))
    .filter((label): label is string => label !== null)
}

export function tagHierarchyDisplayLabels(source: string): string[] {
  const tag = normalizeTagName(source)
  if (!tag) return []

  const parts = tag.split('/').filter(Boolean)
  return parts
    .map((_part, index) => tagDisplayLabel(parts.slice(0, index + 1).join('/')))
    .filter((label): label is string => label !== null)
}

export function tagMatchesReference(source: string, reference: string): boolean {
  const tag = normalizeTagName(source).toLowerCase()
  const target = normalizeTagName(reference).toLowerCase()
  if (!tag || !target) return false
  return tag === target || tag.startsWith(`${target}/`)
}

export function normalizeTagName(source: string): string {
  let tag = source.trim()
  if (tag.startsWith('#')) tag = tag.slice(1)
  if (tag.endsWith('#')) tag = tag.slice(0, -1)

  return tag
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

export function tagLabel(source: string): string | null {
  const tag = normalizeTagName(source)
  if (!tag) return null

  return `#${tag}${/\s/.test(tag) ? '#' : ''}`
}

export function tagDisplayLabel(source: string): string | null {
  const tag = normalizeTagName(source)
  return tag || null
}

export function tagNameFromToken(source: string): string | null {
  const token = source.trim()
  if (!token.startsWith('#')) return null

  const closed = token.length > 2 && token.endsWith('#')
  const name = normalizeTagName(token)
  if (!name) return null

  return closed ? validClosedTagName(name) : validOpenTagName(name)
}

export function tagTokenAt(source: string, from: number): TagToken | null {
  if (source[from] !== '#') return null
  if (!isTagBoundaryBefore(source, from)) return null

  const closed = closedTagTokenAt(source, from)
  if (closed) return closed

  const match = /^#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)/u.exec(source.slice(from))
  if (!match) return null

  const token = match[0]
  const name = tagNameFromToken(token)
  return name ? { token, name, from, to: from + token.length } : null
}

export function tagTokensInText(source: string): TagToken[] {
  const tokens: TagToken[] = []
  let index = 0

  while (index < source.length) {
    const from = source.indexOf('#', index)
    if (from < 0) break

    const token = tagTokenAt(source, from)
    if (token) {
      tokens.push(token)
      index = token.to
    } else {
      index = from + 1
    }
  }

  return tokens
}

export function tagTokenEndingAt(source: string, to = source.length): TagToken | null {
  const tokens = tagTokensInText(source.slice(0, to))
  const token = tokens[tokens.length - 1]
  return token && token.to === to ? token : null
}

function closedTagTokenAt(source: string, from: number): TagToken | null {
  const closeFrom = source.indexOf('#', from + 1)
  if (closeFrom <= from + 1 || !isTagBoundaryAfter(source, closeFrom)) return null

  const token = source.slice(from, closeFrom + 1)
  const name = tagNameFromToken(token)
  return name ? { token, name, from, to: closeFrom + 1 } : null
}

function validOpenTagName(name: string): string | null {
  return /^[\p{L}\p{N}_][\p{L}\p{N}_/-]*$/u.test(name) ? name : null
}

function validClosedTagName(name: string): string | null {
  return /^[\p{L}\p{N}_][\p{L}\p{N}_/ -]*$/u.test(name) ? name : null
}

function isTagBoundaryBefore(source: string, from: number): boolean {
  const previous = source[from - 1]
  return !previous || !/[\p{L}\p{N}_/-]/u.test(previous)
}

function isTagBoundaryAfter(source: string, closeFrom: number): boolean {
  const next = source[closeFrom + 1]
  return !next || !/[\p{L}\p{N}_/-]/u.test(next)
}
