import { type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import type { NanoBlock } from '../../entities/document/nano-document-model'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import { parseInlineMarkdown } from '../../codecs/markdown/nano-markdown-inline-parse'
import { nanoMarkdownFromDocument } from '../../codecs/markdown/nano-markdown-serialize'
import {
  nanoBlocksFromProseMirror,
  prosemirrorDocFromNano,
} from '../../adapters/prosemirror/prosemirror-document'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'

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

  const paragraph = paragraphFromSelectedAtom(selection.node, blockId(selection.node) || 'source')
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
  const mark: Extract<NanoBlock, { type: 'paragraph' }>['marks'][number] = {
    type: 'link',
    from: 0,
    to: text.length,
    href: src,
    image: true,
  }
  if (!alt) mark.imageEmptyAlt = true
  if (node.attrs.destinationStyle === 'angle') mark.destinationStyle = 'angle'
  if (typeof node.attrs.title === 'string' && node.attrs.title) mark.title = node.attrs.title

  return prosemirrorDocFromNano({
    blocks: [{
      id,
      type: 'paragraph',
      text,
      marks: [mark],
    } satisfies NanoBlock],
  }).firstChild
}
