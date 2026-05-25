import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import type { BlockTemplate } from '../assembly/capability'
import {
  blockWithTrailingParagraph,
  sourceBlockId,
} from './nano-block-option-node-helpers'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export function noteRefNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): Fragment | null {
  if (template.type !== 'note_ref') return null

  const id = sourceBlockId(source, 'note-ref')
  const noteRef = nanoSchema.nodes[nanoNodeNames.noteRef].create({
    id,
    target: template.target,
    alias: template.alias ?? '',
  })
  return blockWithTrailingParagraph(noteRef, id)
}

export function tagRefNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): Fragment | null {
  if (template.type !== 'tag_ref') return null

  const id = sourceBlockId(source, 'tag-ref')
  const tagRef = nanoSchema.nodes[nanoNodeNames.tagRef].create({
    id,
    name: template.name,
  })
  return blockWithTrailingParagraph(tagRef, id)
}
