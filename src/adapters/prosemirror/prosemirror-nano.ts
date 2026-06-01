import { type Node as ProseMirrorNode } from 'prosemirror-model'
import { Selection, TextSelection } from 'prosemirror-state'
import type { JSONPatchOperation, Pointer, SelectionPoint, SelectionSnap } from 'zod-crud'
import {
  NanoDocumentSchema,
  blockTextPointer,
  blocksPointer,
  point,
  pointOffset,
  pointPath,
  replaceBlocksPatch,
  selectionSnap,
} from '../../core/nano-core'
import type { NanoBlock, NanoDocument } from '../../core/nano-core'
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

export function textMergePathForDocuments(previous: NanoDocument, next: NanoDocument): Pointer | null {
  if (previous.blocks.length !== next.blocks.length) return null

  const changedBlockIndexes = next.blocks
    .map((block, index) => JSON.stringify(block) === JSON.stringify(previous.blocks[index]) ? -1 : index)
    .filter((index) => index >= 0)
  if (changedBlockIndexes.length !== 1) return null

  const index = changedBlockIndexes[0]!
  const current = previous.blocks[index]!
  const candidate = next.blocks[index]!
  if (current.id !== candidate.id || current.type !== candidate.type) return null

  if (textBlockMergeable(current, candidate)) return blockTextPointer(index)
  if (current.type === 'table' && candidate.type === 'table') {
    return tableCellMergePath(index, current.rows, candidate.rows)
  }
  return null
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

function textBlockMergeable(current: NanoBlock, candidate: NanoBlock): boolean {
  if (!('text' in current) || !('text' in candidate)) return false
  if (current.text === candidate.text) return false

  return JSON.stringify(withoutKeys(current, ['marks', 'text']))
    === JSON.stringify(withoutKeys(candidate, ['marks', 'text']))
}

function tableCellMergePath(index: number, currentRows: readonly string[][], nextRows: readonly string[][]): Pointer | null {
  if (currentRows.length !== nextRows.length) return null

  const changedCells: Array<{ column: number; row: number }> = []
  for (const [rowIndex, row] of nextRows.entries()) {
    const currentRow = currentRows[rowIndex]
    if (!currentRow || currentRow.length !== row.length) return null

    for (const [columnIndex, value] of row.entries()) {
      if (value !== currentRow[columnIndex]) changedCells.push({ column: columnIndex, row: rowIndex })
    }
  }

  if (changedCells.length !== 1) return null

  const cell = changedCells[0]!
  return `/blocks/${index}/rows/${cell.row}/${cell.column}` as Pointer
}

function withoutKeys<T extends Record<string, unknown>>(value: T, keys: readonly string[]): Record<string, unknown> {
  const copy: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (!keys.includes(key)) copy[key] = item
  }
  return copy
}

function nanoPointFromProseMirrorPosition(doc: ProseMirrorNode, position: number): SelectionPoint | null {
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

function prosemirrorPositionFromNanoPoint(doc: ProseMirrorNode, value: SelectionPoint): number {
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
