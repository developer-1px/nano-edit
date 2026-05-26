import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'
import { footnoteLabel } from '../core/nano-footnote'
import {
  boldMarker,
  codeBacktickToken,
  italicMarker,
} from '../codecs/markdown/nano-markdown-inline-utils'
import { tagLabel } from '../core/nano-tag'
import {
  linkSyntax,
  markdownLinkClose,
} from '../adapters/prosemirror/prosemirror-link-dom'
import { nanoMarkNames } from '../adapters/prosemirror/prosemirror-nano'
import { noteLinkTitle } from '../adapters/prosemirror/prosemirror-note-tag-dom'

export interface InlineMarkRange {
  mark: Mark
  from: number
  to: number
}

export type InlineMarkSource =
  | { kind: 'boundary'; open: string; close: string; priority: number }
  | { kind: 'replacement'; source: string; priority: number }

export function collectInlineMarkRanges(block: ProseMirrorNode): InlineMarkRange[] {
  const segments: InlineMarkRange[] = []
  block.descendants((node, position) => {
    if (!node.isText || !node.text) return

    for (const mark of node.marks) {
      if (mark.type.name === nanoMarkNames.source) continue
      segments.push({ mark, from: position, to: position + node.text.length })
    }
  })

  segments.sort((left, right) =>
    markIdentity(left.mark).localeCompare(markIdentity(right.mark))
    || left.from - right.from
    || left.to - right.to)

  const merged: InlineMarkRange[] = []
  for (const segment of segments) {
    const previous = merged[merged.length - 1]
    if (previous && previous.mark.eq(segment.mark) && previous.to === segment.from) {
      previous.to = segment.to
      continue
    }
    merged.push({ ...segment })
  }

  return merged.sort((left, right) =>
    left.from - right.from
    || markPriority(left.mark) - markPriority(right.mark)
    || left.to - right.to)
}

export function inlineSourceForMark(mark: Mark, text: string): InlineMarkSource | null {
  switch (mark.type.name) {
    case nanoMarkNames.link:
      return linkSourceForMark(mark)
    case nanoMarkNames.bold: {
      const marker = boldMarker(mark.attrs.marker)
      return { kind: 'boundary', open: marker, close: marker, priority: 20 }
    }
    case nanoMarkNames.italic: {
      const marker = italicMarker(mark.attrs.marker)
      return { kind: 'boundary', open: marker, close: marker, priority: 30 }
    }
    case nanoMarkNames.underline:
      return { kind: 'boundary', open: '~', close: '~', priority: 35 }
    case nanoMarkNames.strike:
      return { kind: 'boundary', open: '~~', close: '~~', priority: 40 }
    case nanoMarkNames.highlight:
      return { kind: 'boundary', open: '==', close: '==', priority: 45 }
    case nanoMarkNames.code: {
      const token = codeBacktickToken(mark.attrs.backtickLength, text)
      return { kind: 'boundary', open: token, close: token, priority: 50 }
    }
    case nanoMarkNames.tag:
      return replacementSource(tagLabel(String(mark.attrs.name ?? '')) ?? `#${String(mark.attrs.name ?? '')}`, 60)
    case nanoMarkNames.noteLink:
      return replacementSource(noteLinkTitle(mark.attrs.target, mark.attrs.alias), 65)
    case nanoMarkNames.math:
      return replacementSource(`$${String(mark.attrs.formula ?? '')}$`, 70)
    case nanoMarkNames.footnoteRef:
      return replacementSource(footnoteLabel(String(mark.attrs.name ?? '')) ?? `[^${String(mark.attrs.name ?? '')}]`, 75)
    default:
      return null
  }
}

function linkSourceForMark(mark: Mark): InlineMarkSource | null {
  const href = String(mark.attrs.href ?? '')
  const syntax = linkSyntax(mark.attrs.syntax)
  if (syntax === 'autolink') return replacementSource(`<${href}>`, 10)
  if (syntax === 'bare') return null

  const close = markdownLinkClose(mark.attrs.href, mark.attrs.title, mark.attrs.destinationStyle)
  if (mark.attrs.image === true) {
    return mark.attrs.imageEmptyAlt === true
      ? { kind: 'boundary', open: '!', close: close.slice(1), priority: 10 }
      : { kind: 'boundary', open: '![', close, priority: 10 }
  }

  return { kind: 'boundary', open: '[', close, priority: 10 }
}

function replacementSource(source: string, priority: number): InlineMarkSource {
  return { kind: 'replacement', source, priority }
}

function markPriority(mark: Mark): number {
  return inlineSourceForMark(mark, '')?.priority ?? 100
}

function markIdentity(mark: Mark): string {
  return `${mark.type.name}:${JSON.stringify(mark.attrs)}`
}
