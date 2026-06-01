export interface NoteLinkParts {
  target: string
  alias?: string
}

export interface NoteLinkToken {
  from: number
  to: number
  token: string
  target: string
  alias?: string
}

export function noteLinkTokenAt(source: string, from: number): NoteLinkToken | null {
  if (source[from] !== '[' || source[from + 1] !== '[') return null

  const closeFrom = source.indexOf(']]', from + 2)
  if (closeFrom < from + 2) return null

  const to = closeFrom + 2
  const token = source.slice(from, to)
  const parts = noteLinkParts(token)
  if (!parts) return null

  return { from, to, token, target: parts.target, ...(parts.alias ? { alias: parts.alias } : {}) }
}

export function noteLinkTokensInText(source: string): NoteLinkToken[] {
  const tokens: NoteLinkToken[] = []
  let index = 0
  while (index < source.length) {
    const token = noteLinkTokenAt(source, index)
    if (token) {
      tokens.push(token)
      index = token.to
      continue
    }
    index += 1
  }
  return tokens
}

export function noteLinkTarget(source: string): string {
  return noteLinkParts(source)?.target ?? ''
}

export function noteLinkNavigationTarget(source: string): string {
  const target = noteLinkTarget(source)
  const hashIndex = target.indexOf('#')
  if (hashIndex < 0) return target

  const heading = target.slice(hashIndex + 1).trim().replace(/\s+/g, ' ')
  return heading || target.slice(0, hashIndex).trim() || target
}

export function noteLinkLabel(source: string): string | null {
  const target = noteLinkTarget(source)
  return target ? `[[${target}]]` : null
}

export function noteLinkParts(source: string): NoteLinkParts | null {
  const parts = noteLinkRawParts(source)
  const target = parts.target.replace(/\s+/g, ' ')
  const alias = parts.alias?.replace(/\s+/g, ' ')
  if (!target || /[\n\r]/.test(target) || /[\n\r]/.test(alias ?? '')) return null

  return { target, ...(alias ? { alias } : {}) }
}

function noteLinkRawParts(source: string): { target: string; alias?: string } {
  let content = source.trim()
  if (content.startsWith('[[') && content.endsWith(']]')) content = content.slice(2, -2)

  const separator = content.indexOf('|')
  if (separator < 0) return { target: content.trim() }

  const target = content.slice(0, separator).trim()
  const alias = content.slice(separator + 1).trim()
  return { target, ...(alias ? { alias } : {}) }
}
