import {
  bulletMarker,
  clampIndent,
  indentText,
  normalizeContinuationIndents,
  orderedMarker,
  orderedStart,
  orderedStartText,
} from './prosemirror-block-attrs'
import { listContinuationDefaultIndent } from './nano-markdown-block-attrs'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import {
  inlineContentFromText,
  nanoMarksFromProseMirrorNode,
} from './prosemirror-mark-codecs'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const listItemBlockCodec = defineNanoBlockCodec({
  nanoType: 'list_item',
  nodeName: nanoNodeNames.listItem,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.listItem].create(
    {
      id: block.id,
      kind: block.kind,
      continuationIndents: normalizeContinuationIndents(block.continuationIndents),
      indent: block.indent ?? 0,
      indentText: indentText(block.indentText),
      marker: block.kind === 'bullet' ? bulletMarker(block.marker) : '-',
      orderedMarker: block.kind === 'ordered' ? orderedMarker(block.orderedMarker) : '.',
      orderedStartText: block.kind === 'ordered' ? orderedStartText(block.orderedStartText) : null,
      start: block.kind === 'ordered' ? orderedStart(block.start) : null,
    },
    inlineContentFromText(block.text, block.marks),
  ),
  toNano: (node, id) => {
    const kind = node.attrs.kind === 'ordered' ? 'ordered' : 'bullet'
    const start = orderedStart(node.attrs.start)
    const startText = orderedStartText(node.attrs.orderedStartText)
    const rawIndent = indentText(node.attrs.indentText)
    const indent = clampIndent(Number(node.attrs.indent))
    const marker = listMarkerText(node.attrs, kind, rawIndent, indent, start, startText)
    const continuationIndents = normalizeContinuationIndentsForText(
      node.attrs.continuationIndents,
      node.textContent,
      listContinuationDefaultIndent(marker),
    )
    return {
      id,
      type: 'list_item',
      kind,
      ...(continuationIndents ? { continuationIndents } : {}),
      indent,
      ...(rawIndent ? { indentText: rawIndent } : {}),
      ...(kind === 'ordered' && start ? { start } : {}),
      ...(kind === 'bullet' && bulletMarker(node.attrs.marker) !== '-' ? { marker: bulletMarker(node.attrs.marker) } : {}),
      ...(kind === 'ordered' && orderedMarker(node.attrs.orderedMarker) !== '.' ? { orderedMarker: orderedMarker(node.attrs.orderedMarker) } : {}),
      ...(kind === 'ordered' && startText ? { orderedStartText: startText } : {}),
      text: node.textContent,
      marks: nanoMarksFromProseMirrorNode(node),
    }
  },
})

function listMarkerText(
  attrs: Record<string, unknown>,
  kind: 'bullet' | 'ordered',
  rawIndent: string | null | undefined,
  indent: number,
  start: number | null,
  startText: string | null | undefined,
): string {
  const indentTextValue = rawIndent ?? '  '.repeat(indent)
  const marker = kind === 'ordered'
    ? `${startText ?? String(start ?? 1)}${orderedMarker(attrs.orderedMarker)}`
    : bulletMarker(attrs.marker)
  return `${indentTextValue}${marker}`
}

function normalizeContinuationIndentsForText(
  indents: unknown,
  text: string,
  defaultIndent: string,
): string[] | null {
  const normalized = normalizeContinuationIndents(indents)
  const continuationCount = Math.max(0, text.split('\n').length - 1)
  if (!normalized || continuationCount === 0) return null

  const values = Array.from({ length: continuationCount }, (_value, index) => normalized[index] ?? defaultIndent)
  return values.some((indent) => indent !== defaultIndent) ? values : null
}
