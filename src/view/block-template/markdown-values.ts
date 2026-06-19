import type { BlockTemplate } from '../../assembly/capability'
import {
  clampIndent,
  indentText,
} from '../../capabilities/block-indent-values'
import {
  markdownOrderedStart,
  nextOrderedStartAttrs as nextMarkdownOrderedStartAttrs,
} from '../../codecs/markdown/nano-markdown-list-attrs'

export function markdownIndent(indent: unknown, rawIndent?: unknown): string {
  return indentText(rawIndent) ?? '  '.repeat(clampIndent(indent))
}

function markdownOrderedMarker(start: unknown): number {
  return markdownOrderedStart(start) ?? 1
}

export function nextOrderedTemplateStartAttrs(template: Extract<BlockTemplate, { type: 'list_item' }>): { orderedStartText?: string; start?: number } {
  return nextMarkdownOrderedStartAttrs(markdownOrderedMarker(template.start), template.orderedStartText)
}
