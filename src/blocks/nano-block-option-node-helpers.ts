import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { generatedBlockId } from './nano-block-option-keyboard'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export function blockWithTrailingParagraph(block: ProseMirrorNode, id: string): Fragment {
  const paragraph = nanoSchema.nodes[nanoNodeNames.paragraph].create({ id: generatedBlockId(id, 'after') })
  return Fragment.fromArray([block, paragraph])
}

export function sourceBlockId(source: string | ProseMirrorNode, suffix: string): string {
  return typeof source === 'string'
    ? source
    : typeof source.attrs.id === 'string' && source.attrs.id
      ? source.attrs.id
      : generatedBlockId('b', suffix)
}
