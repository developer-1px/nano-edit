export type UrlSyntax = 'autolink' | 'bare'

export interface UrlToken {
  from: number
  href: string
  syntax: UrlSyntax
  to: number
  token: string
}

export function externalUrlTokenAt(source: string, from: number): UrlToken | null {
  return autolinkTokenAt(source, from) ?? bareUrlTokenAt(source, from)
}

export function externalUrlTokenEndingAt(source: string, to = source.length): UrlToken | null {
  return externalUrlTokensInText(source).findLast((token) => token.to === to) ?? null
}

export function externalUrlTokensInText(source: string): UrlToken[] {
  const tokens: UrlToken[] = []
  let index = 0
  while (index < source.length) {
    const token = externalUrlTokenAt(source, index)
    if (token) {
      tokens.push(token)
      index = token.to
      continue
    }
    index += 1
  }
  return tokens
}

export function hrefFileName(href: string): string {
  const clean = href.replace(/[?#].*$/, '').replace(/[/\\]+$/, '')
  return clean.split(/[/\\]/).filter(Boolean).at(-1) ?? href
}

export function hrefDisplayLabel(href: string): string {
  try {
    const url = new URL(href)
    return url.protocol === 'mailto:' ? href.replace(/^mailto:/i, '') : url.hostname || href
  } catch {
    return href.replace(/^https?:\/\//i, '').replace(/^mailto:/i, '')
  }
}

function autolinkTokenAt(source: string, from: number): UrlToken | null {
  if (source[from] !== '<') return null

  const closeFrom = source.indexOf('>', from + 1)
  if (closeFrom <= from + 1) return null

  const href = source.slice(from + 1, closeFrom).trim()
  if (!isExternalHref(href)) return null

  return {
    from,
    href,
    syntax: 'autolink',
    to: closeFrom + 1,
    token: source.slice(from, closeFrom + 1),
  }
}

function bareUrlTokenAt(source: string, from: number): UrlToken | null {
  if (!isBareUrlBoundary(source, from)) return null

  const candidate = bareUrlCandidateAt(source, from)
  if (!candidate) return null

  const token = trimTrailingUrlPunctuation(candidate)
  if (!isExternalHref(token)) return null

  return {
    from,
    href: token,
    syntax: 'bare',
    to: from + token.length,
    token,
  }
}

function isBareUrlBoundary(source: string, from: number): boolean {
  if (from <= 0) return true
  return /[\s([{"']/.test(source[from - 1] ?? '')
}

function trimTrailingUrlPunctuation(source: string): string {
  return source.replace(/[.,;:!?]+$/g, '')
}

function bareUrlCandidateAt(source: string, from: number): string | null {
  const prefix = /^(?:https?:\/\/|mailto:)/i.exec(source.slice(from))?.[0]
  if (!prefix) return null

  const contentFrom = from + prefix.length
  let depth = 0
  let index = contentFrom
  let balancedTo = contentFrom

  while (index < source.length) {
    const char = source[index]
    if (!char || /[\s<>\[\]{}"']/.test(char)) break
    if (char === '(') {
      depth += 1
      index += 1
      continue
    }
    if (char === ')') {
      if (depth === 0) break
      depth -= 1
      index += 1
      if (depth === 0) balancedTo = index
      continue
    }

    index += 1
    if (depth === 0) balancedTo = index
  }

  if (balancedTo <= contentFrom) return null
  return source.slice(from, balancedTo)
}

function isExternalHref(href: string): boolean {
  return /^(?:https?:\/\/|mailto:)\S+$/i.test(href)
}
