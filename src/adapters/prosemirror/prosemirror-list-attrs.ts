import {
  clampIndent,
  indentText as markdownIndentText,
  markdownOrderedStart,
  orderedStartText as markdownOrderedStartText,
} from '../../codecs/markdown/nano-markdown-list-attrs'
import {
  bulletMarker,
  orderedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'

export { bulletMarker, clampIndent, orderedMarker }

export function blockIndentAttrs(indent: unknown): Record<string, string> {
  const value = clampIndent(typeof indent === 'number' ? indent : Number(indent))
  return {
    'data-indent': String(value),
    style: `--nano-indent: ${value};`,
  }
}

export function indentText(indent: unknown): string | null {
  return markdownIndentText(indent) ?? null
}

export function indentTextAttrs(indent: unknown): Record<string, string> {
  const value = indentText(indent)
  return value ? { 'data-indent-text': value } : {}
}

export function orderedStartText(start: unknown): string | null {
  return markdownOrderedStartText(start) ?? null
}

export function orderedStartTextAttrs(start: unknown): Record<string, string> {
  const value = orderedStartText(start)
  return value ? { 'data-ordered-start-text': value } : {}
}

export function orderedStart(start: unknown): number | null {
  return markdownOrderedStart(start)
}
