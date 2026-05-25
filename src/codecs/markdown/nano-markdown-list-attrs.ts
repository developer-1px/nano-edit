import type { ListContinuationIndent } from './nano-markdown-types'

export function clampIndent(indent: unknown): number {
  const value = typeof indent === 'number' ? Math.trunc(indent) : 0
  return Math.max(0, Math.min(6, value))
}

export function listContinuationIndent(indent: unknown, defaultIndent: ListContinuationIndent): ListContinuationIndent {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent)
    ? indent
    : defaultIndent
}

export function listContinuationDefaultIndent(marker: string): ListContinuationIndent {
  const indent = /^[\t ]*/.exec(marker)?.[0] ?? ''
  return `${indent}${' '.repeat(marker.length - indent.length + 1)}`
}

export function listContinuationIndentAttrs(
  indents: readonly ListContinuationIndent[],
  defaultIndent: ListContinuationIndent,
): { continuationIndents?: ListContinuationIndent[] } {
  const normalized = indents.map((indent) => listContinuationIndent(indent, defaultIndent))
  return normalized.some((indent) => indent !== defaultIndent) ? { continuationIndents: normalized } : {}
}

export function markdownIndentLevel(indent: string): number {
  return clampIndent(Math.floor(markdownIndentColumns(indent) / 2))
}

export function markdownIndentColumns(indent: string): number {
  return [...indent].reduce((total, char) => total + (char === '\t' ? 4 : 1), 0)
}

export function markdownIndentText(indent: unknown): string | undefined {
  if (typeof indent !== 'string' || !/^[\t ]+$/.test(indent)) return undefined

  const canonical = '  '.repeat(markdownIndentLevel(indent))
  return indent === canonical ? undefined : indent
}

export function indentText(indent: unknown): string | undefined {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : undefined
}

export function markdownOrderedStart(start: unknown): number | null {
  if (start === null || start === undefined || start === '') return null

  const value = typeof start === 'number' ? start : Number(start)
  if (!Number.isFinite(value)) return null

  return Math.max(1, Math.trunc(value))
}

export function orderedStartText(start: unknown): string | undefined {
  if (typeof start !== 'string' || !/^\d+$/.test(start)) return undefined

  const value = markdownOrderedStart(start)
  return value === null || start === String(value) ? undefined : start
}
