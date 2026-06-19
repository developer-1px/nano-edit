import { todoBlockFromProseMirrorNode, todoNodeAttrsFromBlock } from '../../capabilities/todo/prosemirror'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { inlineContentFromText } from './prosemirror-inline-content'
import { nanoMarksFromProseMirrorNode } from './prosemirror-mark-normalize'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const todoBlockCodec = defineNanoBlockCodec({
  nanoType: 'todo',
  nodeName: nanoNodeNames.todo,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.todo].create(
    todoNodeAttrsFromBlock(block),
    inlineContentFromText(block.text, block.marks),
  ),
  toNano: (node, id) => todoBlockFromProseMirrorNode(node, id, nanoMarksFromProseMirrorNode(node)),
})
