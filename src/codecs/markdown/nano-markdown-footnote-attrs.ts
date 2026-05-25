import type { FootnoteContinuationIndent } from './nano-markdown-types'

export function footnoteContinuationIndent(indent: unknown): FootnoteContinuationIndent {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : '    '
}

export function footnoteContinuationIndentAttrs(indents: readonly FootnoteContinuationIndent[]): { footnoteContinuationIndents?: FootnoteContinuationIndent[] } {
  const normalized = indents.map(footnoteContinuationIndent)
  return normalized.some((indent) => indent !== '    ') ? { footnoteContinuationIndents: normalized } : {}
}
