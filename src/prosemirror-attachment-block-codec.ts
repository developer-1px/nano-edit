import { destinationStyle } from './prosemirror-atom-dom'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const attachmentBlockCodec = defineNanoBlockCodec({
  nanoType: 'attachment',
  nodeName: nanoNodeNames.attachment,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.attachment].create({
    id: block.id,
    src: block.src,
    label: block.label ?? '',
    title: block.title ?? '',
    destinationStyle: destinationStyle(block.destinationStyle),
  }),
  toNano: (node, id) => {
    const label = typeof node.attrs.label === 'string' && node.attrs.label ? node.attrs.label : null
    const title = typeof node.attrs.title === 'string' && node.attrs.title ? node.attrs.title : null
    const nodeDestinationStyle = destinationStyle(node.attrs.destinationStyle)
    return {
      id,
      type: 'attachment',
      src: String(node.attrs.src ?? ''),
      ...(label ? { label } : {}),
      ...(title ? { title } : {}),
      ...(nodeDestinationStyle ? { destinationStyle: nodeDestinationStyle } : {}),
    }
  },
})
