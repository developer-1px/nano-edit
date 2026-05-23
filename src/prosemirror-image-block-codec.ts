import { nonBlankStringValue } from './nano-block-schema-refinements'
import { destinationStyle } from './prosemirror-atom-dom'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const imageBlockCodec = defineNanoBlockCodec({
  nanoType: 'image',
  nodeName: nanoNodeNames.image,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.image].create({
    id: block.id,
    src: block.src,
    alt: block.alt ?? '',
    destinationStyle: destinationStyle(block.destinationStyle),
    title: block.title ?? '',
  }),
  toNano: (node, id) => {
    const alt = typeof node.attrs.alt === 'string' && node.attrs.alt ? node.attrs.alt : null
    const nodeDestinationStyle = destinationStyle(node.attrs.destinationStyle)
    const title = typeof node.attrs.title === 'string' && node.attrs.title ? node.attrs.title : null
    const src = nonBlankStringValue(node.attrs.src)
    if (!src) return { id, type: 'paragraph', text: alt ?? title ?? '', marks: [] }

    return {
      id,
      type: 'image',
      src,
      ...(alt ? { alt } : {}),
      ...(nodeDestinationStyle ? { destinationStyle: nodeDestinationStyle } : {}),
      ...(title ? { title } : {}),
    }
  },
})
