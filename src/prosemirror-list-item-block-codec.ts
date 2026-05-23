import {
  bulletMarker,
  clampIndent,
  indentText,
  normalizeContinuationIndents,
  orderedMarker,
  orderedStart,
  orderedStartText,
} from './prosemirror-block-attrs'
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
    const continuationIndents = normalizeContinuationIndents(node.attrs.continuationIndents)
    return {
      id,
      type: 'list_item',
      kind,
      ...(continuationIndents ? { continuationIndents } : {}),
      indent: clampIndent(Number(node.attrs.indent)),
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
