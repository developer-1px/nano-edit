import {
  defineNanoBlockCodec,
} from './prosemirror-block-codec-types'
import {
  inlineContentFromText,
  nanoMarksFromProseMirrorNode,
} from './prosemirror-mark-codecs'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const paragraphBlockCodec = defineNanoBlockCodec({
  nanoType: 'paragraph',
  nodeName: nanoNodeNames.paragraph,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.paragraph].create(
    { id: block.id },
    inlineContentFromText(block.text, block.marks),
  ),
  toNano: (node, id) => ({ id, type: 'paragraph', text: node.textContent, marks: nanoMarksFromProseMirrorNode(node) }),
})
