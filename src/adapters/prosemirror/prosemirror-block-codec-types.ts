import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoBlock } from '../../core/nano-core'

export type NanoBlockType = NanoBlock['type']
export type NanoBlockFor<TType extends NanoBlockType> = Extract<NanoBlock, { type: TType }>

export interface NanoBlockCodec<TType extends NanoBlockType> {
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
    fromNano: (block) => block.type === codec.nanoType
      ? codec.fromNano(block as NanoBlockFor<TType>)
      : null,
    toNano: codec.toNano as (node: ProseMirrorNode, id: string) => NanoBlock,
  }
}
