import type { BlockTemplate } from '../../assembly/capability'
import { todoTemplateMarkdownLine } from '../../capabilities/todo/view'
import {
  bulletMarker,
  orderedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'
import { orderedStartMarkerText } from '../../codecs/markdown/nano-markdown-list-attrs'
import { quoteMarkerDepth } from '../../codecs/markdown/nano-markdown-quote-attrs'
import {
  markdownIndent,
} from './markdown-values'

export function markdownLineForTextBlockTemplate(template: BlockTemplate): string | null {
  const text = templateText(template)
  if (text === null) return null

  switch (template.type) {
    case 'heading':
      return markdownMarkedLine('#'.repeat(template.level), text)
    case 'quote':
      return markdownQuoteLine(template.quoteMarkerSpacing?.[0], template.quoteMarkerDepths?.[0], text)
    case 'callout':
      return markdownCalloutLine(template.tone, template.calloutMarkerSpacing?.[0], template.calloutMarkerDepths?.[0], template.calloutTextSpacing, text)
    case 'footnote':
      if (template.footnoteTextSpacing === 'none') return `[^${template.name}]:${text}`
      return markdownMarkedLine(`[^${template.name}]:`, text)
    case 'math':
      return template.mathStyle === 'single' && text && !/[\r\n]/.test(text)
        ? `$$${text}$$`
        : `$$\n${text}\n$$`
    case 'todo':
      return todoTemplateMarkdownLine(template, text)
    case 'list_item':
      return markdownMarkedLine(
        `${markdownIndent(template.indent, template.indentText)}${template.kind === 'ordered' ? `${orderedStartMarkerText(template.start, template.orderedStartText)}${orderedMarker(template.orderedMarker)}` : bulletMarker(template.marker)}`,
        text,
      )
    default:
      return null
  }
}

export function templateText(template: BlockTemplate): string | null {
  return 'text' in template && typeof template.text === 'string' ? template.text : null
}

function markdownMarkedLine(marker: string, text: string): string {
  return text ? `${marker} ${text}` : marker
}

function markdownQuoteLine(spacing: unknown, depth: unknown, text: string): string {
  const marker = '>'.repeat(quoteMarkerDepth(depth))
  return spacing === 'none' ? `${marker}${text}` : `${marker} ${text}`
}

function markdownCalloutLine(tone: string, markerSpacing: unknown, markerDepth: unknown, textSpacing: unknown, text: string): string {
  const marker = '>'.repeat(quoteMarkerDepth(markerDepth))
  const quoteMarker = markerSpacing === 'none' ? marker : `${marker} `
  const gap = textSpacing === 'none' ? '' : ' '
  return `${quoteMarker}[!${tone.toUpperCase()}]${text ? `${gap}${text}` : ''}`
}
