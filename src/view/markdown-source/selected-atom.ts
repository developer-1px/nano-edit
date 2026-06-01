import { type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import type { NanoBlock } from '../../core/nano-core'
import { parseInlineMarkdown } from '../../codecs/markdown/nano-markdown-inline-parse'
import { nanoMarkdownFromDocument } from '../../codecs/markdown/nano-markdown'
import {
  nanoBlocksFromProseMirror,
  nanoNodeNames,
  nanoSchema,
  prosemirrorDocFromNano,
} from '../../adapters/prosemirror/prosemirror-nano'

const sourceableAtomNodeNames = new Set<string>([
  nanoNodeNames.bookmark,
  nanoNodeNames.noteRef,
  nanoNodeNames.tagRef,
  nanoNodeNames.attachment,
  nanoNodeNames.divider,
  nanoNodeNames.image,
  nanoNodeNames.table,
])

export function selectedAtomSourceTransaction(state: EditorState): Transaction | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null
  if (!sourceableAtomNodeNames.has(selection.node.type.name)) return null

  const paragraph = paragraphFromSelectedAtom(selection.node, blockId(selection.node))
  if (!paragraph) return null

  const transaction = state.tr.replaceWith(selection.from, selection.to, paragraph)
  transaction.setSelection(TextSelection.create(transaction.doc, selection.from + 1))
  return transaction
}

function paragraphFromSelectedAtom(node: ProseMirrorNode, id: string): ProseMirrorNode | null {
  if (node.type.name === nanoNodeNames.divider) return paragraphFromRawMarkdown(selectedNodeMarkdown(node), id)
  if (node.type.name === nanoNodeNames.image) return paragraphFromImage(node, id)
  return paragraphFromMarkdown(selectedNodeMarkdown(node), id)
}

function selectedNodeMarkdown(node: ProseMirrorNode): string {
  const doc = nanoSchema.nodes[nanoNodeNames.doc].create(null, [node])
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(doc) })
}

function paragraphFromMarkdown(markdown: string, id: string): ProseMirrorNode | null {
  const parsed = parseInlineMarkdown(markdown)
  return prosemirrorDocFromNano({
    blocks: [{
      id,
      type: 'paragraph',
      text: parsed.text,
      marks: parsed.marks,
    } satisfies NanoBlock],
  }).firstChild
}

function paragraphFromRawMarkdown(markdown: string, id: string): ProseMirrorNode | null {
  return prosemirrorDocFromNano({
    blocks: [{
      id,
      type: 'paragraph',
      text: markdown,
      marks: [{ type: 'source', from: 0, to: markdown.length }],
    } satisfies NanoBlock],
  }).firstChild
}

function paragraphFromImage(node: ProseMirrorNode, id: string): ProseMirrorNode | null {
  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : ''
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
  if (!src) return paragraphFromMarkdown(selectedNodeMarkdown(node), id)

  const text = alt || '[]'
  return prosemirrorDocFromNano({
    blocks: [{
      id,
      type: 'paragraph',
      text,
      marks: [{
        type: 'link',
        from: 0,
        to: text.length,
        href: src,
        image: true,
        ...(alt ? {} : { imageEmptyAlt: true }),
        ...(node.attrs.destinationStyle === 'angle' ? { destinationStyle: 'angle' as const } : {}),
        ...(typeof node.attrs.title === 'string' && node.attrs.title ? { title: node.attrs.title } : {}),
      }],
    } satisfies NanoBlock],
  }).firstChild
}

function blockId(node: ProseMirrorNode): string {
  return typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : 'source'
}
