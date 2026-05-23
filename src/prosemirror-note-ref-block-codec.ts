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
    const target = typeof node.attrs.target === 'string' && node.attrs.target ? node.attrs.target : ''
    const alias = typeof node.attrs.alias === 'string' && node.attrs.alias ? node.attrs.alias : null
    return {
      id,
      type: 'note_ref',
      target,
      ...(alias ? { alias } : {}),
    }
  },
})
