import { todoIndexBlockLabel } from '../../capabilities/todo/indexing'
import type { NanoBlock } from '../../entities/document/nano-document-model'
import { tagHierarchyDisplayLabels } from '../../entities/reference/nano-tag'
import {
  attachmentIndexLabel,
  bookmarkIndexLabel,
} from './link-labels'
import { codeFenceToken } from '../../codecs/markdown/nano-markdown-code-utils'
import {
  atxClosingLength,
  atxSpacing,
  setextLength,
  setextMarker,
} from '../../codecs/markdown/nano-markdown-heading-attrs'
import { orderedStartText } from '../../codecs/markdown/nano-markdown-list-attrs'
import {
  bulletMarker,
  dividerMarkdown,
  orderedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'

export function indexBlockLabel(block: NanoBlock): string {
  switch (block.type) {
    case 'heading':
      return headingBlockLabel(block)
    case 'quote':
      return plainTextPreview(block.text) || 'Quote'
    case 'callout':
      return calloutBlockLabel(block)
    case 'todo':
      return todoIndexBlockLabel(block, plainTextPreview).replace(/^[-*+] \[[ xX]\]\s*/, '') || 'Todo'
    case 'list_item':
      return plainTextPreview(block.text) || (block.kind === 'ordered' ? 'Numbered list' : 'Bullet list')
    case 'footnote':
      return footnoteBlockLabel(block)
    case 'code':
      return block.language ? `Code ${block.language}` : 'Code'
    case 'math':
      return mathBlockLabel(block.text)
    case 'divider':
      return 'Divider'
    case 'image':
      return block.alt || 'Image'
    case 'bookmark':
      return bookmarkIndexLabel(block)
    case 'attachment':
      return attachmentIndexLabel(block)
    case 'note_ref':
      return noteRefIndexLabel(block)
    case 'tag_ref':
      return tagHierarchyDisplayLabels(block.name).at(-1) ?? block.name
    case 'table':
      return `table ${block.rows.length}x${Math.max(0, ...block.rows.map((row) => row.length))}`
    case 'paragraph':
      return plainTextPreview(block.text)
    default:
      return customBlockLabel(block)
  }
}

export function indexBlockSearchLabel(block: NanoBlock): string {
  switch (block.type) {
    case 'heading':
      return headingBlockSourceLabel(block)
    case 'quote':
      return `${quoteMarker(block.quoteMarkerSpacing?.[0], block.text)}${plainTextPreview(block.text)}`
    case 'callout':
      return calloutBlockSourceLabel(block)
    case 'todo':
      return todoIndexBlockLabel(block, plainTextPreview)
    case 'list_item':
      return [
        block.kind === 'ordered' ? `${orderedStartText(block.orderedStartText) ?? '1'}${orderedMarker(block.orderedMarker)}` : bulletMarker(block.marker),
        plainTextPreview(block.text),
      ].join(' ')
    case 'footnote':
      return footnoteBlockSourceLabel(block)
    case 'code':
      return `${codeFenceToken(block.fenceMarker, block.fenceLength)}${block.language ?? ''}`
    case 'math':
      return mathBlockSourceLabel(block.text)
    case 'divider':
      return dividerMarkdown(block.marker, block.markerLength)
    case 'image':
      return `![${block.alt ?? 'image'}]`
    case 'note_ref':
      return noteRefSourceLabel(block)
    default:
      return indexBlockLabel(block)
  }
}

function customBlockLabel(block: NanoBlock): string {
  return 'text' in block && block.text
    ? plainTextPreview(block.text)
    : block.type
}

export function headingBlockLabel(block: Extract<NanoBlock, { type: 'heading' }>): string {
  return plainTextPreview(block.text) || 'Heading'
}

function headingBlockSourceLabel(block: Extract<NanoBlock, { type: 'heading' }>): string {
  if (block.headingStyle === 'setext' && block.level <= 2) {
    return `${block.text} ${setextMarker(block.setextMarker, block.level).repeat(setextLength(block.setextLength))}`
  }

  const textSpacing = block.text ? ' '.repeat(atxSpacing(block.atxTextSpacing)) : ''
  const closing = block.atxClosingLength ? `${' '.repeat(atxSpacing(block.atxClosingSpacing))}${'#'.repeat(atxClosingLength(block.atxClosingLength))}` : ''
  return `${'#'.repeat(block.level)}${textSpacing}${block.text}${closing}`
}

export function calloutBlockLabel(block: Extract<NanoBlock, { type: 'callout' }>): string {
  const firstLine = block.text.split('\n')[0] ?? ''
  const text = plainTextPreview(firstLine)
  const tone = block.tone ? block.tone.charAt(0).toUpperCase() + block.tone.slice(1) : 'Callout'
  return text ? `${tone}: ${text}` : tone
}

function calloutBlockSourceLabel(block: Extract<NanoBlock, { type: 'callout' }>): string {
  const firstLine = block.text.split('\n')[0] ?? ''
  const textSpacing = block.calloutTextSpacing === 'none' ? '' : firstLine ? ' ' : ''
  return `${quoteMarker(block.calloutMarkerSpacing?.[0], firstLine)}[!${block.tone.toUpperCase()}]${textSpacing}${plainTextPreview(firstLine)}`
}

export function mathBlockLabel(text: string): string {
  return plainTextPreview(text) || 'Math'
}

function mathBlockSourceLabel(text: string): string {
  return `$$ ${plainTextPreview(text)} $$`
}

export function footnoteBlockLabel(block: Extract<NanoBlock, { type: 'footnote' }>): string {
  const text = plainTextPreview(block.text)
  return text ? `${block.name}: ${text}` : block.name
}

function footnoteBlockSourceLabel(block: Extract<NanoBlock, { type: 'footnote' }>): string {
  return `[^${block.name}]: ${plainTextPreview(block.text)}`
}

export function noteRefIndexLabel(block: Extract<NanoBlock, { type: 'note_ref' }>): string {
  return block.alias || block.target
}

function noteRefSourceLabel(block: Extract<NanoBlock, { type: 'note_ref' }>): string {
  return block.alias ? `[[${block.target}|${block.alias}]]` : `[[${block.target}]]`
}

function plainTextPreview(text: string): string {
  const preview = text.replace(/\s+/g, ' ').trim()
  return preview.length > 48 ? `${preview.slice(0, 45)}...` : preview || '(empty)'
}

function quoteMarker(spacing: unknown, text: string): '>' | '> ' {
  if (spacing === 'space') return '> '
  if (spacing === 'none') return '>'
  return text.trim() ? '> ' : '>'
}
