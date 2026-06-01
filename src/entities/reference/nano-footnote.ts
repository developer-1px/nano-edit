export interface FootnoteToken {
  from: number
  token: string
  name: string
  to: number
}

export interface FootnoteDefinition {
  name: string
  text: string
  textSpacing: 'space' | 'none'
}

export function footnoteLabel(source: string): string | null {
  const name = footnoteName(source)
  return name ? `[^${name}]` : null
}

export function footnoteName(source: string): string {
  let name = source.trim()
  if (name.startsWith('[^') && name.endsWith(']')) name = name.slice(2, -1)
  name = name.trim()

  return name && !/[\s\]\r\n]/.test(name) ? name : ''
}

export function footnoteRefAt(source: string, from: number): FootnoteToken | null {
  if (!source.startsWith('[^', from)) return null

  const closeFrom = source.indexOf(']', from + 2)
  if (closeFrom <= from + 2) return null

  const token = source.slice(from, closeFrom + 1)
  const name = footnoteName(token)
  return name ? { from, token, name, to: closeFrom + 1 } : null
}

export function footnoteDefinition(source: string): FootnoteDefinition | null {
  const match = /^\[\^([^\]\s\r\n]+)\]:( ?)(.*)?$/.exec(source)
  if (!match) return null

  const name = footnoteName(match[1] ?? '')
  if (!name) return null

  return { name, text: match[3] ?? '', textSpacing: match[2] === ' ' ? 'space' : 'none' }
}
