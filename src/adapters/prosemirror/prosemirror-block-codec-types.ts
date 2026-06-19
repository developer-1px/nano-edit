import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoBlock } from '../../entities/document/nano-document-model'

type NanoBlockType = NanoBlock['type']
type NanoBlockFor<TType extends NanoBlockType> = Extract<NanoBlock, { type: TType }>

interface NanoBlockCodec<TType extends NanoBlockType> {
  nanoType: TType
  nodeName: string
  fromNano: (block: NanoBlockFor<TType>) => ProseMirrorNode
  toNano: (node: ProseMirrorNode, id: string) => NanoBlock
}

export interface AnyNanoBlockCodec {
  nanoType: NanoBlockType
  nodeName: string
  fromNano: (block: NanoBlock) => ProseMirrorNode | null
  toNano: (node: ProseMirrorNode, id: string) => NanoBlock
}

export function defineNanoBlockCodec<TType extends NanoBlockType>(
  codec: NanoBlockCodec<TType>,
): AnyNanoBlockCodec {
  return {
    nanoType: codec.nanoType,
    nodeName: codec.nodeName,
    fromNano: (block) => isNanoBlockFor(block, codec.nanoType)
      ? codec.fromNano(block)
      : null,
    toNano: codec.toNano,
  }
}

function isNanoBlockFor<TType extends NanoBlockType>(
  block: NanoBlock,
  type: TType,
): block is NanoBlockFor<TType> {
  return block.type === type
}
