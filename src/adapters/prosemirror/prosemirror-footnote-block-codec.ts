import type { NanoBlock } from '../../entities/document/nano-document-model'
import { footnoteName } from '../../entities/reference/nano-footnote'
import { normalizeFootnoteContinuationIndents } from './prosemirror-continuation-indent-attrs'
import { textSpacingValue } from './prosemirror-quote-marker-attrs'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { inlineContentFromText } from './prosemirror-inline-content'
import { nanoMarksFromProseMirrorNode } from './prosemirror-mark-normalize'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const footnoteBlockCodec = defineNanoBlockCodec({
  nanoType: 'footnote',
  nodeName: nanoNodeNames.footnote,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.footnote].create(
    {
      id: block.id,
      footnoteContinuationIndents: normalizeFootnoteContinuationIndents(block.footnoteContinuationIndents),
      footnoteTextSpacing: textSpacingValue(block.footnoteTextSpacing),
      name: footnoteName(block.name) || '1',
    },
    inlineContentFromText(block.text, block.marks),
  ),
  toNano: (node, id) => {
    const footnoteContinuationIndents = normalizeFootnoteContinuationIndentsForText(
      node.attrs.footnoteContinuationIndents,
      node.textContent,
    )
    const block: Extract<NanoBlock, { type: 'footnote' }> = {
      id,
      type: 'footnote',
      name: footnoteName(String(node.attrs.name ?? '1')) || '1',
      text: node.textContent,
      marks: nanoMarksFromProseMirrorNode(node),
    }
    if (footnoteContinuationIndents) block.footnoteContinuationIndents = footnoteContinuationIndents
    if (textSpacingValue(node.attrs.footnoteTextSpacing) === 'none') block.footnoteTextSpacing = 'none'
    return block
  },
})

function normalizeFootnoteContinuationIndentsForText(indents: unknown, text: string): string[] | null {
  const normalized = normalizeFootnoteContinuationIndents(indents)
  const continuationCount = Math.max(0, text.split('\n').length - 1)
  if (!normalized || continuationCount === 0) return null

  const values = Array.from({ length: continuationCount }, (_value, index) => normalized[index] ?? '    ')
  return values.some((indent) => indent !== '    ') ? values : null
}
