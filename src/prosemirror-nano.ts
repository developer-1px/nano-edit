import { type Node as ProseMirrorNode } from 'prosemirror-model'
import { Selection, TextSelection } from 'prosemirror-state'
import type { JSONPatchOperation, JSONPoint, Pointer, SelectionSnap } from 'zod-crud'
import {
  NanoDocumentSchema,
  blockTextPointer,
  blocksPointer,
  point,
  pointOffset,
  pointPath,
  replaceBlocksPatch,
  selectionSnap,
} from './nano-core'
import type { NanoBlock, NanoDocument } from './nano-core'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'
import {
  createBlockId,
  nanoBlockFromProseMirrorNode,
  prosemirrorNodeFromNanoBlock,
} from './prosemirror-block-codecs'

export { rawMarkdownInlineDomSpec } from './prosemirror-raw-markdown'
export { nanoMarkNames, nanoNodeNames } from './prosemirror-names'
export { nanoSchema } from './prosemirror-schema'

export function prosemirrorDocFromNano(document: NanoDocument): ProseMirrorNode {
  const validDocument = NanoDocumentSchema.parse(document)
  return nanoSchema.nodes[nanoNodeNames.doc].create(
    null,
    validDocument.blocks.map(prosemirrorNodeFromNanoBlock),
  )
}

export function nanoBlocksFromProseMirror(doc: ProseMirrorNode): NanoBlock[] {
  return nanoDocumentFromProseMirror(doc).blocks
}

export function nanoDocumentFromProseMirror(doc: ProseMirrorNode): NanoDocument {
  const blocks: NanoBlock[] = []
  const usedIds = new Set<string>()

  doc.forEach((node, _offset, index) => {
    blocks.push(nanoBlockFromProseMirrorNode(node, index, usedIds))
  })

  return NanoDocumentSchema.parse({
    blocks: blocks.length > 0 ? blocks : [{ id: createBlockId(0), type: 'paragraph', text: '', marks: [] }],
  })
}

export function nanoPatchFromDocuments(
  previous: NanoDocument,
  nextDoc: ProseMirrorNode,
): JSONPatchOperation[] {
  return replaceBlocksPatch(previous, nanoDocumentFromProseMirror(nextDoc).blocks)
}

export function nanoSelectionFromProseMirror(doc: ProseMirrorNode, selection: Selection): SelectionSnap | null {
  const anchor = nanoPointFromProseMirrorPosition(doc, selection.anchor)
  const focus = nanoPointFromProseMirrorPosition(doc, selection.head)
  return anchor && focus ? selectionSnap(anchor, focus) : null
}

export function prosemirrorSelectionFromNano(
  doc: ProseMirrorNode,
  selection: SelectionSnap | undefined,
): Selection {
  const range = selection?.selectionRanges[selection.primaryIndex]
  if (!range) return TextSelection.create(doc, firstTextPosition(doc))

  const anchor = prosemirrorPositionFromNanoPoint(doc, range.anchor)
  const focus = prosemirrorPositionFromNanoPoint(doc, range.focus)
  return TextSelection.create(doc, anchor, focus)
}

export function textMergePathForPatch(patch: readonly JSONPatchOperation[]): Pointer | null {
  return patch.every((operation) => operation.path === blocksPointer()) ? blocksPointer() : null
}

function nanoPointFromProseMirrorPosition(doc: ProseMirrorNode, position: number): JSONPoint | null {
  if (doc.childCount === 0) return null

  const target = clamp(position, 0, doc.content.size)
  let blockStart = 0

  for (let index = 0; index < doc.childCount; index += 1) {
    const block = doc.child(index)
    const textLength = block.textContent.length
    const contentStart = blockStart + 1
    const contentEnd = contentStart + textLength
    if (target <= contentEnd || index === doc.childCount - 1) {
      return point(blockTextPointer(index), clamp(target - contentStart, 0, textLength))
    }

    blockStart += block.nodeSize
  }
  return null
}

function prosemirrorPositionFromNanoPoint(doc: ProseMirrorNode, value: JSONPoint): number {
  const match = /^\/blocks\/(\d+)\/text$/.exec(pointPath(value))
  if (!match || doc.childCount === 0) return firstTextPosition(doc)

  const blockIndex = clamp(Number(match[1]), 0, doc.childCount - 1)
  let blockStart = 0
  for (let index = 0; index < blockIndex; index += 1) {
    blockStart += doc.child(index).nodeSize
  }

  const block = doc.child(blockIndex)
  return blockStart + 1 + clamp(pointOffset(value), 0, block.textContent.length)
}

function firstTextPosition(doc: ProseMirrorNode): number {
  let position = 0
  for (let index = 0; index < doc.childCount; index += 1) {
    const block = doc.child(index)
    if (block.isTextblock) return position + 1
    position += block.nodeSize
  }
  return 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
