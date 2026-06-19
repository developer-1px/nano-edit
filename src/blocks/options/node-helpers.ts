import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { generatedBlockId } from '../../capabilities/block-behavior-id'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'

export function blockWithTrailingParagraph(block: ProseMirrorNode, id: string): Fragment {
  const paragraph = nanoSchema.nodes[nanoNodeNames.paragraph].create({ id: generatedBlockId(id, 'after') })
  return Fragment.fromArray([block, paragraph])
}

export function sourceBlockId(source: string | ProseMirrorNode, suffix: string): string {
  return typeof source === 'string'
    ? source
    : blockId(source) || generatedBlockId(null, suffix)
}
