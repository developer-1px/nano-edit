export function blockIndentAttrs(indent: unknown): Record<string, string> {
  const value = clampIndent(typeof indent === 'number' ? indent : Number(indent))
  return {
    'data-indent': String(value),
    style: `--nano-indent: ${value};`,
  }
}

export function indentText(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

export function indentTextAttrs(indent: unknown): Record<string, string> {
  const value = indentText(indent)
  return value ? { 'data-indent-text': value } : {}
}

export function bulletMarker(marker: unknown): '-' | '*' | '+' {
  return marker === '*' || marker === '+' ? marker : '-'
}

export function orderedMarker(marker: unknown): '.' | ')' {
  return marker === ')' ? ')' : '.'
}

export function orderedStartText(start: unknown): string | null {
  if (typeof start !== 'string' || !/^\d+$/.test(start)) return null

  const value = orderedStart(start)
  return value === null || start === String(value) ? null : start
}

export function orderedStartTextAttrs(start: unknown): Record<string, string> {
  const value = orderedStartText(start)
  return value ? { 'data-ordered-start-text': value } : {}
}

export function orderedStart(start: unknown): number | null {
  if (start === null || start === undefined || start === '') return null

  const value = typeof start === 'number' ? start : Number(start)
  if (!Number.isFinite(value)) return null

  return Math.max(1, Math.trunc(value))
}

export function clampIndent(value: number): number {
  return Math.max(0, Math.min(6, Number.isFinite(value) ? Math.trunc(value) : 0))
}
