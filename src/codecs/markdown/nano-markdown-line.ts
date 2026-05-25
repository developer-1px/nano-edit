import type { NanoBlock } from '../../core/nano-core'
import {
  parseMarkdownAtomicBlock,
  parseMarkdownImage,
} from './nano-markdown-atomic'
import { parseFootnoteLine } from './nano-markdown-footnote'
import {
  parseAtxHeadingLine,
  parseDividerLine,
} from './nano-markdown-heading-divider'
import { isMathBlockLine } from './nano-markdown-math-code'
import { markdownListLine } from './nano-markdown-list'
import { nextMarkdownBlockId } from './nano-markdown-state'
import { textBlock } from './nano-markdown-text-block'
import type {
  BulletMarker,
  CheckedMarker,
  ListContinuationIndent,
  MarkdownParseState,
  OrderedMarker,
} from './nano-markdown-types'

export function parseMarkdownLine(line: string, state: MarkdownParseState): NanoBlock | null {
  const trimmed = line.trim()
  const image = parseMarkdownImage(trimmed)
  if (image) {
    return {
      id: nextMarkdownBlockId(state),
      type: 'image',
      src: image.src,
      ...(image.alt ? { alt: image.alt } : {}),
      ...(image.destinationStyle ? { destinationStyle: image.destinationStyle } : {}),
      ...(image.title ? { title: image.title } : {}),
    }
  }

  const atomic = parseMarkdownAtomicBlock(trimmed)
  if (atomic) return { id: nextMarkdownBlockId(state), ...atomic } as NanoBlock

  const divider = parseDividerLine(trimmed, state)
  if (divider) return divider

  const heading = parseAtxHeadingLine(line, state)
  if (heading) return heading

  const footnote = parseFootnoteLine(line, state)
  if (footnote) return footnote

  const list = markdownListLine(line)
  if (list) {
    return list.type === 'todo'
      ? textBlock('todo', list.text, state, list.attrs as { checked: boolean; continuationIndents?: ListContinuationIndent[]; indent?: number; indentText?: string; marker?: BulletMarker; checkedMarker?: CheckedMarker })
      : textBlock('list_item', list.text, state, list.attrs as { kind: 'bullet' | 'ordered'; continuationIndents?: ListContinuationIndent[]; indent?: number; indentText?: string; marker?: BulletMarker; orderedMarker?: OrderedMarker; orderedStartText?: string; start?: number | null })
  }

  return null
}

export function isMarkdownBlockLine(line: string): boolean {
  return parseMarkdownImage(line.trim()) !== null
    || isMathBlockLine(line)
    || parseMarkdownAtomicBlock(line.trim()) !== null
    || /^(#{1,6})(?:\s+|$)/.test(line)
    || /^\[\^[^\]\s\r\n]+\]:/.test(line)
    || /^[ \t]*[-*+]\s+\[[ xX]\](?:\s+|$)/.test(line)
    || /^[ \t]*[-*+](?:\s+|$)/.test(line)
    || /^[ \t]*\d+[.)](?:\s+|$)/.test(line)
    || /^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())
}
