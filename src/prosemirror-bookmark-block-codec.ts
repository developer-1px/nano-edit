import {
  bookmarkSyntax,
  destinationStyle,
} from './prosemirror-atom-dom'
import { nonBlankStringValue } from './nano-block-schema-refinements'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const bookmarkBlockCodec = defineNanoBlockCodec({
  nanoType: 'bookmark',
  nodeName: nanoNodeNames.bookmark,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.bookmark].create({
    id: block.id,
    href: block.href,
    label: block.label ?? '',
    title: block.title ?? '',
    destinationStyle: destinationStyle(block.destinationStyle),
    syntax: bookmarkSyntax(block.syntax),
  }),
  toNano: (node, id) => {
    const label = typeof node.attrs.label === 'string' && node.attrs.label ? node.attrs.label : null
    const title = typeof node.attrs.title === 'string' && node.attrs.title ? node.attrs.title : null
    const href = nonBlankStringValue(node.attrs.href)
    if (!href) return { id, type: 'paragraph', text: label ?? title ?? '', marks: [] }

    const nodeDestinationStyle = destinationStyle(node.attrs.destinationStyle)
    const syntax = bookmarkSyntax(node.attrs.syntax)
    return {
      id,
      type: 'bookmark',
      href,
      ...(label ? { label } : {}),
      ...(title ? { title } : {}),
      ...(nodeDestinationStyle ? { destinationStyle: nodeDestinationStyle } : {}),
      ...(syntax !== 'bare' ? { syntax } : {}),
    }
  },
})
