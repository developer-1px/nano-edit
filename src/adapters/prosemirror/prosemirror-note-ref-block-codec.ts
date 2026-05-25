import { nonBlankStringValue } from '../../core/schema/nano-block-schema-refinements'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const noteRefBlockCodec = defineNanoBlockCodec({
  nanoType: 'note_ref',
  nodeName: nanoNodeNames.noteRef,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.noteRef].create({
    id: block.id,
    target: block.target,
    alias: block.alias ?? '',
  }),
  toNano: (node, id) => {
    const target = nonBlankStringValue(node.attrs.target)
    const alias = typeof node.attrs.alias === 'string' && node.attrs.alias ? node.attrs.alias : null
    if (!target) return { id, type: 'paragraph', text: alias ?? '', marks: [] }

    return {
      id,
      type: 'note_ref',
      target,
      ...(alias ? { alias } : {}),
    }
  },
})
