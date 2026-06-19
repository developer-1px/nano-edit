import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, Selection, TextSelection, type Transaction } from 'prosemirror-state'
import {
  nextBlockId,
  nextUnusedBlockId,
} from '../../capabilities/block-behavior-id'
import {
  activeBlockRange,
  headingSectionRanges,
  listSubtreeRanges,
} from '../../entities/block/structure/nano-block-ranges'
import {
  blockId,
  isHeadingNode,
} from '../../entities/block/structure/nano-block-node-kind'
import type { ActiveBlockRange } from '../../entities/block/structure/nano-block-structure-types'
import { movedBlockSelection } from '../selection/placement'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'

export function deleteSelectedBlockTransaction(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null

  return deleteActiveBlockTransaction(state, collapsedBlockIds)
}

export function duplicateActiveBlockTransaction(state: EditorState): Transaction | null {
  const block = activeBlockRange(state)
  if (!block) return null

  const ranges = listSubtreeRanges(state.doc, block)
  const duplicateRanges = ranges.length > 0 ? ranges : [block]
  const insertAt = duplicateRanges.at(-1)?.to ?? block.to
  const duplicates = duplicateBlockRangeNodes(state.doc, duplicateRanges)
  const transaction = state.tr.replaceWith(insertAt, insertAt, Fragment.fromArray(duplicates))
  transaction.setSelection(movedBlockSelection(state, transaction.doc, block, insertAt))
  return transaction
}

export function deleteActiveBlockTransaction(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  const block = activeBlockRange(state)
  if (!block) return null

  const deleteRange = blockDeleteRange(state.doc, block, collapsedBlockIds)
  if (deleteRange.from === 0 && deleteRange.to === state.doc.content.size) {
    const id = blockId(block.node) || nextBlockId(state.doc, 'b')
    const paragraph = nanoSchema.nodes.paragraph.create({ id })
    const transaction = state.tr.replaceWith(deleteRange.from, deleteRange.to, paragraph)
    transaction.setSelection(TextSelection.create(transaction.doc, deleteRange.from + 1))
    return transaction
  }

  const transaction = state.tr.delete(deleteRange.from, deleteRange.to)
  const position = Math.min(deleteRange.from, transaction.doc.content.size)
  transaction.setSelection(Selection.near(transaction.doc.resolve(position), 1))
  return transaction
}

function blockDeleteRange(
  doc: ProseMirrorNode,
  block: ActiveBlockRange,
  collapsedBlockIds: ReadonlySet<string>,
): { from: number; to: number } {
  const id = blockId(block.node)
  const subtree = id && collapsedBlockIds.has(id) && isHeadingNode(block.node)
    ? headingSectionRanges(doc, block)
    : listSubtreeRanges(doc, block)
  return { from: block.from, to: subtree[subtree.length - 1]?.to ?? block.to }
}

function duplicateBlockRangeNodes(doc: ProseMirrorNode, ranges: readonly ActiveBlockRange[]): ProseMirrorNode[] {
  const usedIds = usedBlockIds(doc)
  return ranges.map((range) => {
    const id = nextDuplicateBlockId(usedIds, blockId(range.node))
    return range.node.type.create({ ...range.node.attrs, id }, range.node.content, range.node.marks)
  })
}

function usedBlockIds(doc: ProseMirrorNode): Set<string> {
  const ids = new Set<string>()
  doc.descendants((node) => {
    const id = blockId(node)
    if (id) ids.add(id)
  })
  return ids
}

function nextDuplicateBlockId(usedIds: Set<string>, base: unknown): string {
  const id = nextUnusedBlockId(usedIds, base)
  usedIds.add(id)
  return id
}
