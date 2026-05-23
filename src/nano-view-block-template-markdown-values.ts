import type { BlockTemplate } from './nano-block-options'

export function quoteMarkerSpacing(spacing: unknown): Array<'space' | 'none'> | null {
  return Array.isArray(spacing) && spacing.length > 0
    ? spacing.map((value) => value === 'none' ? 'none' : 'space')
    : null
}

export function quoteMarkerDepths(depths: unknown): number[] | null {
  if (!Array.isArray(depths) || depths.length === 0) return null
  const normalized = depths.map(quoteMarkerDepth)
  return normalized.some((value) => value !== 1) ? normalized : null
}

export function markdownIndent(indent: unknown, rawIndent?: unknown): string {
  return indentText(rawIndent) ?? '  '.repeat(markdownIndentLevelForTemplate(indent))
}

export function indentText(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

export function markdownIndentLevelForTemplate(indent: unknown): number {
  const value = typeof indent === 'number' && Number.isFinite(indent) ? Math.trunc(indent) : 0
  return Math.max(0, Math.min(6, value))
}

export function markdownOrderedMarker(start: unknown): number {
  if (start === null || start === undefined || start === '') return 1

  const value = typeof start === 'number' ? start : Number(start)
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
}

export function markdownOrderedMarkerText(start: unknown, startText: unknown): string {
  return orderedStartText(startText) ?? String(markdownOrderedMarker(start))
}

export function nextOrderedTemplateStartAttrs(template: Extract<BlockTemplate, { type: 'list_item' }>): { orderedStartText?: string; start?: number } {
  return nextOrderedStartAttrs(markdownOrderedMarker(template.start), orderedStartText(template.orderedStartText))
}

export function nextOrderedStartAttrs(start: number | null, startText: string | null): { orderedStartText?: string; start?: number } {
  if (start === null) return {}

  const next = start + 1
  if (!startText) return { start: next }

  const nextText = String(next).padStart(startText.length, '0')
  return {
    start: next,
    ...(orderedStartText(nextText) ? { orderedStartText: nextText } : {}),
  }
}

export function markdownBulletMarker(marker: unknown): '-' | '*' | '+' {
  return marker === '*' || marker === '+' ? marker : '-'
}

export function orderedStartText(start: unknown): string | null {
  if (typeof start !== 'string' || !/^\d+$/.test(start)) return null

  const value = markdownOrderedMarker(start)
  return start === String(value) ? null : start
}

export function markdownOrderedListMarker(marker: unknown): '.' | ')' {
  return marker === ')' ? ')' : '.'
}

export function quoteMarkerDepth(depth: unknown): number {
  const value = typeof depth === 'number' && Number.isFinite(depth) ? Math.trunc(depth) : 1
  return Math.max(1, value)
}
