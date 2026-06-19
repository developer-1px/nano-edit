import type { NanoBlock } from '../../entities/document/nano-document-model'
import {
  atxClosingLengthOrNull,
  atxSpacingOrNull,
  clampHeadingLevel,
  headingAtxAttrs,
  headingStyle,
  setextLength,
  setextMarker,
} from './prosemirror-heading-attrs'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { inlineContentFromText } from './prosemirror-inline-content'
import { nanoMarksFromProseMirrorNode } from './prosemirror-mark-normalize'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const headingBlockCodec = defineNanoBlockCodec({
  nanoType: 'heading',
  nodeName: nanoNodeNames.heading,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.heading].create(
    {
      id: block.id,
      level: block.level,
      headingStyle: headingStyle(block.headingStyle, block.level),
      atxClosingLength: block.headingStyle === 'setext' ? null : atxClosingLengthOrNull(block.atxClosingLength),
      atxClosingSpacing: block.headingStyle === 'setext' ? null : atxSpacingOrNull(block.atxClosingSpacing),
      atxTextSpacing: block.headingStyle === 'setext' ? null : atxSpacingOrNull(block.atxTextSpacing),
      setextMarker: block.headingStyle === 'setext' ? setextMarker(block.setextMarker, block.level) : null,
      setextLength: block.headingStyle === 'setext' ? setextLength(block.setextLength) : null,
    },
    inlineContentFromText(block.text, block.marks),
  ),
  toNano: (node, id) => {
    const block: Extract<NanoBlock, { type: 'heading' }> = {
      id,
      type: 'heading',
      level: clampHeadingLevel(node.attrs.level),
      text: node.textContent,
      marks: nanoMarksFromProseMirrorNode(node),
    }
    if (headingStyle(node.attrs.headingStyle, node.attrs.level) === 'setext') {
      block.headingStyle = 'setext'
      block.setextMarker = setextMarker(node.attrs.setextMarker, node.attrs.level)
      block.setextLength = setextLength(node.attrs.setextLength)
    } else {
      Object.assign(block, headingAtxAttrs(
        node.attrs.atxClosingLength,
        node.attrs.atxClosingSpacing,
        node.attrs.atxTextSpacing,
      ))
    }
    return block
  },
})
