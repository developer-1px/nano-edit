import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../blocks/nano-block-structure'
import {
  todoBulletMarkerFromNode,
  todoCheckedMarkerFromNode,
  todoSourceMarkerText,
} from '../capabilities/todo/view'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-nano'
import {
  indentText,
  markdownBulletMarker,
  markdownIndent,
  markdownOrderedListMarker,
} from './nano-view-block-template-markdown'

export function listContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {
    indent: nodeIndent(source),
    indentText: indentText(source.attrs.indentText),
  }
  const continuationIndents = sourceListContinuationIndents(source)
  if (continuationIndents) attrs.continuationIndents = continuationIndents

  if (replacement.type.name === nanoNodeNames.todo) {
    const marker = sourceBulletMarker(source)
    if (marker) attrs.marker = marker
    if (source.type.name === nanoNodeNames.todo) attrs.checkedMarker = todoCheckedMarkerFromNode(source)
  } else if (replacement.type.name === nanoNodeNames.listItem && replacement.attrs.kind === 'bullet') {
    const marker = sourceBulletMarker(source)
    if (marker) attrs.marker = marker
  } else if (isOrderedListToOrderedList(source, replacement)) {
    const start = nodeOrderedStart(source)
    const startText = nodeOrderedStartText(source)
    attrs.orderedMarker = markdownOrderedListMarker(source.attrs.orderedMarker)
    attrs.start = start
    attrs.orderedStartText = startText
  }

  return attrs
}

function isOrderedListToOrderedList(source: ProseMirrorNode, replacement: ProseMirrorNode): boolean {
  return replacement.type.name === nanoNodeNames.listItem
    && replacement.attrs.kind === 'ordered'
    && source.type.name === nanoNodeNames.listItem
    && source.attrs.kind === 'ordered'
}

function sourceBulletMarker(node: ProseMirrorNode): '-' | '*' | '+' | null {
  if (node.type.name === nanoNodeNames.todo) return todoBulletMarkerFromNode(node)
  if (node.type.name === nanoNodeNames.listItem && node.attrs.kind === 'bullet') return markdownBulletMarker(node.attrs.marker)
  return null
}

function sourceListContinuationIndents(node: ProseMirrorNode): string[] | null {
  const count = textLineBreakCount(node.textContent)
  if (count <= 0) return null

  const explicit = normalizedContinuationIndents(node.attrs.continuationIndents)
  const fallback = sourceListDefaultContinuationIndent(node)
  if (!fallback) return explicit.length > 0 ? explicit.slice(0, count) : null

  return Array.from({ length: count }, (_unused, index) => explicit[index] ?? fallback)
}

function normalizedContinuationIndents(indents: unknown): string[] {
  if (!Array.isArray(indents)) return []
  return indents.filter((indent): indent is string => typeof indent === 'string' && /^[\t ]+$/.test(indent))
}

function sourceListDefaultContinuationIndent(node: ProseMirrorNode): string | null {
  const marker = sourceListMarkerText(node)
  if (!marker) return null

  const rawIndent = /^[\t ]*/.exec(marker)?.[0] ?? ''
  return `${rawIndent}${' '.repeat(marker.length - rawIndent.length + 1)}`
}

function sourceListMarkerText(node: ProseMirrorNode): string | null {
  const rawIndent = markdownIndent(node.attrs.indent, node.attrs.indentText)
  if (node.type.name === nanoNodeNames.todo) return todoSourceMarkerText(node)
  if (node.type.name !== nanoNodeNames.listItem) return null

  if (node.attrs.kind === 'ordered') {
    const start = nodeOrderedStartText(node) ?? String(nodeOrderedStart(node) ?? 1)
    return `${rawIndent}${start}${markdownOrderedListMarker(node.attrs.orderedMarker)}`
  }

  return `${rawIndent}${markdownBulletMarker(node.attrs.marker)}`
}

function textLineBreakCount(text: string): number {
  return [...text].filter((char) => char === '\n').length
}
