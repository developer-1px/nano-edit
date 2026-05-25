import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import type { DividerMarker } from '../assembly/capability'
import { blockWithTrailingParagraph } from './nano-block-option-node-helpers'
import {
  dividerMarker,
  dividerMarkerLength,
} from './nano-block-option-values'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export function dividerWithTrailingParagraph(id: string, marker?: DividerMarker, markerLength?: number): Fragment {
  return blockWithTrailingParagraph(dividerNode(id, marker, markerLength), id)
}

export function dividerNode(id: string, marker?: DividerMarker, markerLength?: number): ProseMirrorNode {
  return nanoSchema.nodes[nanoNodeNames.divider].create({
    id,
    marker: dividerMarker(marker),
    markerLength: dividerMarkerLength(markerLength),
  })
}
