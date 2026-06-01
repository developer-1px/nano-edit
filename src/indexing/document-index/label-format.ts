export function plainTextPreview(text: string): string {
  const preview = text.replace(/\s+/g, ' ').trim()
  return preview.length > 48 ? `${preview.slice(0, 45)}...` : preview || '(empty)'
}

export function setextMarker(marker: unknown, level: unknown): '=' | '-' {
  if (marker === '=' || marker === '-') return marker
  return level === 1 ? '=' : '-'
}

export function setextLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(1, value)
}

export function atxClosingLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 1
  return Math.max(1, value)
}

export function atxSpacing(spacing: unknown): number {
  const value = typeof spacing === 'number' && Number.isFinite(spacing) ? Math.trunc(spacing) : 1
  return Math.max(1, value)
}

export function quoteMarker(spacing: unknown, text: string): '>' | '> ' {
  if (spacing === 'space') return '> '
  if (spacing === 'none') return '>'
  return text.trim() ? '> ' : '>'
}

export function bulletListMarker(marker: unknown): '-' | '*' | '+' {
  return marker === '*' || marker === '+' ? marker : '-'
}

export function orderedListMarker(marker: unknown): '.' | ')' {
  return marker === ')' ? ')' : '.'
}

export function orderedStartText(start: unknown): string | null {
  if (typeof start !== 'string' || !/^\d+$/.test(start)) return null

  const value = Math.max(1, Math.trunc(Number(start)))
  return Number.isFinite(value) && start !== String(value) ? start : null
}
