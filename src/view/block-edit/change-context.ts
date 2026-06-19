import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import {
  headingLevel,
  isHeadingNode,
  isListLikeNode,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../../entities/block/structure/nano-block-node-kind'
import {
  quoteMarkerDepthsOrNull,
  quoteMarkerSpacingOrNull,
  quoteMarkerSpacingValueOrNull,
  type QuoteMarkerSpacing,
} from '../../entities/source/nano-source-metadata'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import {
  todoBulletMarkerFromNode,
  todoCheckedMarkerFromNode,
  todoSourceMarkerText,
} from '../../capabilities/todo/view'
import { indentText } from '../../capabilities/block-indent-values'
import {
  bulletMarker,
  orderedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'
import { markdownIndent } from '../block-template/markdown-values'

export function blockChangeReplacementWithContext(
  source: ProseMirrorNode,
  replacement: Fragment | ProseMirrorNode | null,
): Fragment | ProseMirrorNode | null {
  if (!replacement || replacement instanceof Fragment) return replacement
  const attrs = blockReplacementContextAttrs(source, replacement)
  return attrs ? replacement.type.create({ ...replacement.attrs, ...attrs }, replacement.content, replacement.marks) : replacement
}

function blockReplacementContextAttrs(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> | null {
  if (isHeadingNode(source) && isHeadingNode(replacement)) {
    return headingContextAttrsForReplacement(source, replacement)
  }
  if (source.type.name === nanoNodeNames.codeBlock && replacement.type.name === nanoNodeNames.codeBlock) {
    return codeBlockContextAttrsForReplacement(source, replacement)
  }
  if ((source.type.name === nanoNodeNames.quote || source.type.name === nanoNodeNames.callout) && replacement.type.name === nanoNodeNames.quote) {
    return quoteContextAttrsForReplacement(source, replacement)
  }
  if ((source.type.name === nanoNodeNames.quote || source.type.name === nanoNodeNames.callout) && replacement.type.name === nanoNodeNames.callout) {
    return calloutContextAttrsForReplacement(source, replacement)
  }
  return isListLikeNode(source) && isListLikeNode(replacement)
    ? listContextAttrsForReplacement(source, replacement)
    : null
}

function headingContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  const level = headingLevel(replacement)
  if (sourceHeadingStyle(source) === 'setext') {
    return level <= 2
      ? {
          headingStyle: 'setext',
          setextLength: headingSetextLength(source.attrs.setextLength),
          setextMarker: level === 1 ? '=' : '-',
        }
      : { headingStyle: 'atx' }
  }

  const closingLength = headingAtxClosingLength(source.attrs.atxClosingLength)
  return {
    headingStyle: 'atx',
    ...(headingAtxSpacingOrNull(source.attrs.atxTextSpacing)
      ? { atxTextSpacing: headingAtxSpacingOrNull(source.attrs.atxTextSpacing) }
      : {}),
    ...(closingLength ? { atxClosingLength: closingLength } : {}),
    ...(closingLength && headingAtxSpacingOrNull(source.attrs.atxClosingSpacing)
      ? { atxClosingSpacing: headingAtxSpacingOrNull(source.attrs.atxClosingSpacing) }
      : {}),
  }
}

function codeBlockContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  const language = typeof replacement.attrs.language === 'string' && replacement.attrs.language
    ? replacement.attrs.language
    : typeof source.attrs.language === 'string' && source.attrs.language
      ? source.attrs.language
      : null

  return {
    language,
    ...(codeFenceIndentOrNull(source.attrs.fenceIndent) ? { fenceIndent: codeFenceIndentOrNull(source.attrs.fenceIndent) } : {}),
    ...(codeFenceInfoSpacingOrNull(source.attrs.fenceInfoSpacing) ? { fenceInfoSpacing: codeFenceInfoSpacingOrNull(source.attrs.fenceInfoSpacing) } : {}),
    fenceMarker: markdownCodeFenceMarker(source.attrs.fenceMarker),
    fenceLength: markdownCodeFenceLength(source.attrs.fenceLength),
  }
}

function quoteContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  return {
    quoteMarkerSpacing: quoteMarkerSpacingOrNull(replacement.attrs.quoteMarkerSpacing)
      ?? quoteLineMarkerSpacing(source),
    quoteMarkerDepths: quoteMarkerDepthsOrNull(replacement.attrs.quoteMarkerDepths)
      ?? quoteLineMarkerDepths(source),
  }
}

function calloutContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  return {
    calloutMarkerDepths: quoteMarkerDepthsOrNull(replacement.attrs.calloutMarkerDepths)
      ?? quoteLineMarkerDepths(source),
    calloutMarkerSpacing: quoteMarkerSpacingOrNull(replacement.attrs.calloutMarkerSpacing)
      ?? quoteLineMarkerSpacing(source),
    calloutTextSpacing: quoteMarkerSpacingValueOrNull(replacement.attrs.calloutTextSpacing)
      ?? quoteMarkerSpacingValueOrNull(source.attrs.calloutTextSpacing),
  }
}

function listContextAttrsForReplacement(
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
    attrs.orderedMarker = orderedMarker(source.attrs.orderedMarker)
    attrs.start = start
    attrs.orderedStartText = startText
  }

  return attrs
}

function sourceHeadingStyle(node: ProseMirrorNode): 'atx' | 'setext' {
  return node.attrs.headingStyle === 'setext' && headingLevel(node) <= 2 ? 'setext' : 'atx'
}

function headingSetextLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(1, value)
}

function headingAtxClosingLength(length: unknown): number | null {
  if (length === null || length === undefined || length === '') return null
  const value = typeof length === 'number' ? length : Number(length)
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : null
}

function headingAtxSpacingOrNull(spacing: unknown): number | null {
  const value = typeof spacing === 'number' && Number.isFinite(spacing) ? Math.max(1, Math.trunc(spacing)) : 1
  return value === 1 ? null : value
}

function codeFenceIndentOrNull(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

function codeFenceInfoSpacingOrNull(spacing: unknown): string | null {
  return typeof spacing === 'string' && /^[\t ]+$/.test(spacing) ? spacing : null
}

function markdownCodeFenceMarker(marker: unknown): '`' | '~' {
  return marker === '~' ? '~' : '`'
}

function markdownCodeFenceLength(length: unknown): number {
  const value = typeof length === 'number' && Number.isFinite(length) ? Math.trunc(length) : 3
  return Math.max(3, value)
}

function quoteLineMarkerSpacing(node: ProseMirrorNode): QuoteMarkerSpacing[] | null {
  if (node.type.name === nanoNodeNames.callout) return quoteMarkerSpacingOrNull(node.attrs.calloutMarkerSpacing)
  return quoteMarkerSpacingOrNull(node.attrs.quoteMarkerSpacing)
}

function quoteLineMarkerDepths(node: ProseMirrorNode): number[] | null {
  if (node.type.name === nanoNodeNames.callout) return quoteMarkerDepthsOrNull(node.attrs.calloutMarkerDepths)
  return quoteMarkerDepthsOrNull(node.attrs.quoteMarkerDepths)
}

function isOrderedListToOrderedList(source: ProseMirrorNode, replacement: ProseMirrorNode): boolean {
  return replacement.type.name === nanoNodeNames.listItem
    && replacement.attrs.kind === 'ordered'
    && source.type.name === nanoNodeNames.listItem
    && source.attrs.kind === 'ordered'
}

function sourceBulletMarker(node: ProseMirrorNode): '-' | '*' | '+' | null {
  if (node.type.name === nanoNodeNames.todo) return todoBulletMarkerFromNode(node)
  if (node.type.name === nanoNodeNames.listItem && node.attrs.kind === 'bullet') return bulletMarker(node.attrs.marker)
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
    return `${rawIndent}${start}${orderedMarker(node.attrs.orderedMarker)}`
  }

  return `${rawIndent}${bulletMarker(node.attrs.marker)}`
}

function textLineBreakCount(text: string): number {
  return [...text].filter((char) => char === '\n').length
}
