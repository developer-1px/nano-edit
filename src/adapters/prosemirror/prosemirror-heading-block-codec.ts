import {
  atxClosingLengthOrNull,
  atxSpacingOrNull,
  clampHeadingLevel,
  headingAtxAttrs,
  headingStyle,
  setextLength,
  setextMarker,
} from './prosemirror-block-attrs'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import {
  inlineContentFromText,
  nanoMarksFromProseMirrorNode,
} from './prosemirror-mark-codecs'
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
  toNano: (node, id) => ({
    id,
    type: 'heading',
    level: clampHeadingLevel(node.attrs.level),
    ...(headingStyle(node.attrs.headingStyle, node.attrs.level) === 'setext'
      ? {
          headingStyle: 'setext' as const,
          setextMarker: setextMarker(node.attrs.setextMarker, node.attrs.level),
          setextLength: setextLength(node.attrs.setextLength),
        }
      : headingAtxAttrs(node.attrs.atxClosingLength, node.attrs.atxClosingSpacing, node.attrs.atxTextSpacing)),
    text: node.textContent,
    marks: nanoMarksFromProseMirrorNode(node),
  }),
})
