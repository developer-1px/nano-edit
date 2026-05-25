import {
  dividerMarker,
  dividerMarkerLength,
} from './prosemirror-block-attrs'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const dividerBlockCodec = defineNanoBlockCodec({
  nanoType: 'divider',
  nodeName: nanoNodeNames.divider,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.divider].create({
    id: block.id,
    marker: dividerMarker(block.marker),
    markerLength: dividerMarkerLength(block.markerLength),
  }),
  toNano: (node, id) => ({
    id,
    type: 'divider',
    ...(dividerMarker(node.attrs.marker) !== '---' ? { marker: dividerMarker(node.attrs.marker) } : {}),
    ...(dividerMarkerLength(node.attrs.markerLength) !== 3 ? { markerLength: dividerMarkerLength(node.attrs.markerLength) } : {}),
  }),
})
