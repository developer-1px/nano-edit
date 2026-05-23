import { nonBlankStringValue } from './nano-block-schema-refinements'
import { normalizeTagName } from './nano-tag'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const tagRefBlockCodec = defineNanoBlockCodec({
  nanoType: 'tag_ref',
  nodeName: nanoNodeNames.tagRef,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.tagRef].create({
    id: block.id,
    name: normalizeTagName(block.name),
  }),
  toNano: (node, id) => {
    const name = nonBlankStringValue(normalizeTagName(String(node.attrs.name ?? '')))
    return name ? { id, type: 'tag_ref', name } : { id, type: 'paragraph', text: '', marks: [] }
  },
})
