export function normalizeContinuationIndents(indents: unknown): string[] | null {
  if (typeof indents === 'string') return decodeContinuationIndents(indents)
  if (!Array.isArray(indents) || indents.length === 0) return null

  const normalized = indents.map(lineIndent).filter((indent) => indent !== null) as string[]
  return normalized.length > 0 ? normalized : null
}

export function continuationIndentDataAttrs(indents: unknown): Record<string, string> {
  const normalized = normalizeContinuationIndents(indents)
  return normalized && normalized.length > 0
    ? { 'data-continuation-indents': normalized.map(encodeLineIndent).join('|') }
    : {}
}

export function decodeContinuationIndents(indents: unknown): string[] | null {
  if (typeof indents !== 'string' || !indents) return null
  const normalized = indents.split('|').map(decodeLineIndent).filter((indent) => indent !== null) as string[]
  return normalized.length > 0 ? normalized : null
}

function lineIndent(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

function encodeLineIndent(indent: string): string {
  return [...indent].map((char) => char === '\t' ? 't' : 's').join('')
}

function decodeLineIndent(encoded: string): string | null {
  const indent = [...encoded].map((char) => char === 't' ? '\t' : char === 's' ? ' ' : '').join('')
  return indent ? indent : null
}
