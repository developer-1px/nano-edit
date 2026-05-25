import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import type { BlockTemplate } from '../assembly/capability'
import {
  blockWithTrailingParagraph,
  sourceBlockId,
} from './nano-block-option-node-helpers'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export function imageNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): Fragment | null {
  if (template.type !== 'image') return null

  const id = sourceBlockId(source, 'image')
  const image = nanoSchema.nodes[nanoNodeNames.image].create({
    id,
    src: template.src,
    alt: template.alt ?? '',
    destinationStyle: template.destinationStyle ?? '',
    title: template.title ?? '',
  })
  return blockWithTrailingParagraph(image, id)
}

export function bookmarkNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): Fragment | null {
  if (template.type !== 'bookmark') return null

  const id = sourceBlockId(source, 'bookmark')
  const bookmark = nanoSchema.nodes[nanoNodeNames.bookmark].create({
    id,
    href: template.href,
    label: template.label ?? '',
    title: template.title ?? '',
    destinationStyle: template.destinationStyle ?? '',
    syntax: template.syntax ?? 'bare',
  })
  return blockWithTrailingParagraph(bookmark, id)
}

export function attachmentNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): Fragment | null {
  if (template.type !== 'attachment') return null

  const id = sourceBlockId(source, 'attachment')
  const attachment = nanoSchema.nodes[nanoNodeNames.attachment].create({
    id,
    src: template.src,
    label: template.label ?? '',
    title: template.title ?? '',
    destinationStyle: template.destinationStyle ?? '',
  })
  return blockWithTrailingParagraph(attachment, id)
}
