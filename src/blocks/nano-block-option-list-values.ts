export function markdownIndentLevel(indent: string): number {
  const columns = [...indent].reduce((total, char) => total + (char === '\t' ? 4 : 1), 0)
  return clampIndent(Math.floor(columns / 2))
}

export function markdownIndentText(indent: unknown): string | undefined {
  if (typeof indent !== 'string' || !/^[\t ]+$/.test(indent)) return undefined

  const canonical = '  '.repeat(markdownIndentLevel(indent))
  return indent === canonical ? undefined : indent
}

export function indentText(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

export function markdownOrderedStart(start: unknown): number | null {
  if (start === null || start === undefined || start === '') return null

  const value = typeof start === 'number' ? start : Number(start)
  if (!Number.isFinite(value)) return null

  return Math.max(1, Math.trunc(value))
}

export function orderedStartTemplateAttrs(start: unknown): { orderedStartText?: string; start?: number } {
  const value = markdownOrderedStart(start)
  const text = orderedStartText(start)
  return {
    ...(value === null ? {} : { start: value }),
    ...(text ? { orderedStartText: text } : {}),
  }
}

export function nextOrderedStartAttrs(attrs: Record<string, unknown>): { orderedStartText?: string; start?: number } {
  const start = markdownOrderedStart(attrs.start)
  if (start === null) return {}

  const next = start + 1
  const startText = orderedStartText(attrs.orderedStartText)
  if (!startText) return { start: next }

  const nextText = String(next).padStart(startText.length, '0')
  return {
    start: next,
    ...(orderedStartText(nextText) ? { orderedStartText: nextText } : {}),
  }
}

export function orderedStartText(start: unknown): string | undefined {
  if (typeof start !== 'string' || !/^\d+$/.test(start)) return undefined

  const value = markdownOrderedStart(start)
  return value === null || start === String(value) ? undefined : start
}

export function blockIndent(attrs: Record<string, unknown>): number {
  return clampIndent(typeof attrs.indent === 'number' ? attrs.indent : Number(attrs.indent))
}

export function clampIndent(indent: unknown): number {
  const value = typeof indent === 'number' && Number.isFinite(indent) ? Math.trunc(indent) : 0
  return Math.max(0, Math.min(6, value))
}
