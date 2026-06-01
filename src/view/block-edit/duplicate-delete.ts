import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, Selection, TextSelection, type Transaction } from 'prosemirror-state'
import { nextBlockId } from '../../blocks/nano-block-options'
import {
  activeBlockRange,
  blockId,
  headingSectionRanges,
  isHeadingNode,
  listSubtreeRanges,
  type ActiveBlockRange,
} from '../../blocks/nano-block-structure'
import { movedBlockSelection } from '../../core/nano-selection'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-nano'

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
  const insertAt = duplicateRanges[duplicateRanges.length - 1]!.to
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
    const id = typeof block.node.attrs.id === 'string' && block.node.attrs.id ? block.node.attrs.id : nextBlockId(state.doc, 'b')
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
    const id = nextDuplicateBlockId(usedIds, range.node.attrs.id)
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
  const prefix = typeof base === 'string' && base ? base : `b${Date.now().toString(36)}`
  let suffix = 2
  while (usedIds.has(`${prefix}-${suffix}`)) suffix += 1

  const id = `${prefix}-${suffix}`
  usedIds.add(id)
  return id
}
