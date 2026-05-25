import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoBlock } from '../../core/nano-core'
import { nanoAtomicBlockCodecs } from './prosemirror-atomic-block-codecs'
import type { AnyNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoTextBlockCodecs, paragraphBlockCodec } from './prosemirror-text-block-codecs'

const nanoBlockCodecs: readonly AnyNanoBlockCodec[] = [
  ...nanoTextBlockCodecs,
  ...nanoAtomicBlockCodecs,
]

export function prosemirrorNodeFromNanoBlock(block: NanoBlock): ProseMirrorNode {
  return nanoBlockCodecForNanoType(block.type)?.fromNano(block)
    ?? paragraphBlockCodec.fromNano(paragraphBlockFromUnknown(block))!
}

export function nanoBlockFromProseMirrorNode(node: ProseMirrorNode, index: number, usedIds: Set<string>): NanoBlock {
  const id = uniqueBlockId(node.attrs.id, index, usedIds)
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
    text: 'text' in block ? block.text : '',
    marks: 'marks' in block ? block.marks : [],
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
