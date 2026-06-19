import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoBlock } from '../../entities/document/nano-document-model'
import { isNanoCustomBlock } from '../../entities/block/schema/nano-block-schema'
import { attachmentBlockCodec } from './prosemirror-attachment-block-codec'
import { bookmarkBlockCodec } from './prosemirror-bookmark-block-codec'
import type { AnyNanoBlockCodec } from './prosemirror-block-codec-types'
import { codeMathBlockCodecs } from './prosemirror-code-math-block-codecs'
import {
  customBlockFromProseMirrorNode,
  customBlockNodeAttrsFromBlock,
  isCustomBlockNode,
} from './prosemirror-custom-block'
import { dividerBlockCodec } from './prosemirror-divider-block-codec'
import { footnoteBlockCodec } from './prosemirror-footnote-block-codec'
import { headingBlockCodec } from './prosemirror-heading-block-codec'
import { imageBlockCodec } from './prosemirror-image-block-codec'
import { listItemBlockCodec } from './prosemirror-list-item-block-codec'
import { noteRefBlockCodec } from './prosemirror-note-ref-block-codec'
import { paragraphBlockCodec } from './prosemirror-paragraph-block-codec'
import { quoteCalloutBlockCodecs } from './prosemirror-quote-callout-block-codecs'
import { tableBlockCodec } from './prosemirror-table-block-codec'
import { tagRefBlockCodec } from './prosemirror-tag-ref-block-codec'
import { todoBlockCodec } from './prosemirror-todo-block-codec'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

const nanoBlockCodecs: readonly AnyNanoBlockCodec[] = [
  paragraphBlockCodec,
  headingBlockCodec,
  ...quoteCalloutBlockCodecs,
  todoBlockCodec,
  listItemBlockCodec,
  footnoteBlockCodec,
  ...codeMathBlockCodecs,
  bookmarkBlockCodec,
  noteRefBlockCodec,
  tagRefBlockCodec,
  attachmentBlockCodec,
  dividerBlockCodec,
  imageBlockCodec,
  tableBlockCodec,
]

export function prosemirrorNodeFromNanoBlock(block: NanoBlock): ProseMirrorNode {
  if (isNanoCustomBlock(block)) {
    return nanoSchema.nodes[nanoNodeNames.customBlock].create(customBlockNodeAttrsFromBlock(block))
  }

  const node = nanoBlockCodecForNanoType(block.type)?.fromNano(block)
    ?? paragraphBlockCodec.fromNano(paragraphBlockFromUnknown(block))
  if (!node) throw new Error(`Could not create ProseMirror node for Nano block type: ${block.type}`)
  return node
}

export function nanoBlockFromProseMirrorNode(node: ProseMirrorNode, index: number, usedIds: Set<string>): NanoBlock {
  const id = uniqueBlockId(node.attrs.id, index, usedIds)
  if (isCustomBlockNode(node)) return customBlockFromProseMirrorNode(node, id)

  return nanoBlockCodecForNodeName(node.type.name)?.toNano(node, id)
    ?? paragraphBlockCodec.toNano(node, id)
}

export function createBlockId(index: number): string {
  return `b${index + 1}`
}

function nanoBlockCodecForNanoType(type: NanoBlock['type']): AnyNanoBlockCodec | null {
  return nanoBlockCodecs.find((codec) => codec.nanoType === type) ?? null
}

function nanoBlockCodecForNodeName(nodeName: string): AnyNanoBlockCodec | null {
  return nanoBlockCodecs.find((codec) => codec.nodeName === nodeName) ?? null
}

function paragraphBlockFromUnknown(block: NanoBlock): Extract<NanoBlock, { type: 'paragraph' }> {
  return {
    id: block.id,
    type: 'paragraph',
    text: 'text' in block && typeof block.text === 'string' ? block.text : '',
    marks: 'marks' in block && Array.isArray(block.marks) ? block.marks : [],
  }
}

function uniqueBlockId(rawId: unknown, index: number, usedIds: Set<string>): string {
  const id = typeof rawId === 'string' && rawId ? rawId : createBlockId(index)
  if (!usedIds.has(id)) {
    usedIds.add(id)
    return id
  }

  let suffix = 2
  while (usedIds.has(`${id}-${suffix}`)) suffix += 1
  const nextId = `${id}-${suffix}`
  usedIds.add(nextId)
  return nextId
}
