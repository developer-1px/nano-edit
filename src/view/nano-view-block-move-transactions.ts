import { Fragment } from 'prosemirror-model'
import type { EditorState, Transaction } from 'prosemirror-state'
import {
  activeBlockRange,
  blockId,
  isListLikeNode,
  listSubtreeRanges,
  topLevelBlockRanges,
  type ActiveBlockRange,
} from '../blocks/nano-block-structure'
import type { IndentDirection, MoveDirection } from './nano-command-surface'
import { movedBlockSelection } from '../core/nano-selection'
import {
  canIndentActiveListSubtree,
  canShiftListSubtree,
  selectedListIndentRanges,
  shiftedListAttrs,
} from './nano-view-list-transforms'
import {
  blockMoveTargetUnit,
  blockMoveTargetUnitForRange,
  canMoveUnitToTarget,
} from './nano-view-block-move-target'
import {
  blockMoveUnitForRange,
  blockMoveUnitsOverlap,
} from './nano-view-block-move-unit'
import {
  type DropPlacement,
  positionForTopLevelRangeIndex,
  reorderedBlockMoveRanges,
} from './nano-view-block-reorder'

export {
  canIndentActiveBlock,
  canMoveActiveBlock,
} from './nano-view-block-move-checks'

export function moveActiveBlockTransaction(
  state: EditorState,
  direction: MoveDirection,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  const block = activeBlockRange(state)
  if (!block) return null

  const ranges = topLevelBlockRanges(state.doc)
  const sourceUnit = blockMoveUnitForRange(state.doc, block, collapsedBlockIds)
  const targetUnit = blockMoveTargetUnit(state.doc, ranges, sourceUnit, direction, collapsedBlockIds)
  if (!targetUnit) return null

  const nextRanges = reorderedBlockMoveRanges(ranges, sourceUnit, targetUnit, direction === 'up' ? 'before' : 'after')
  if (!nextRanges) return null

  const nextSourceIndex = nextRanges.findIndex((range) => range.from === sourceUnit.from)
  const nextSourcePosition = positionForTopLevelRangeIndex(nextRanges, nextSourceIndex)
  if (nextSourcePosition === null) return null
  const nextFrom = nextSourcePosition + (block.from - sourceUnit.from)
  const transaction = state.tr.replaceWith(0, state.doc.content.size, Fragment.fromArray(nextRanges.map((range) => range.node)))
  transaction.setSelection(movedBlockSelection(state, transaction.doc, block, nextFrom))
  return transaction
}

export function indentActiveBlockTransaction(
  state: EditorState,
  direction: IndentDirection,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  const selectedRanges = selectedListIndentRanges(state, collapsedBlockIds)
  if (selectedRanges.length > 1) return indentListRangesTransaction(state, selectedRanges, direction)

  const block = activeBlockRange(state)
  if (!block || !isListLikeNode(block.node)) return null

  const ranges = listSubtreeRanges(state.doc, block)
  if (!canIndentActiveListSubtree(state.doc, ranges, direction)) return null
  return indentListRangesTransaction(state, ranges, direction)
}

export function moveBlockToTargetTransaction(
  state: EditorState,
  sourceId: string,
  targetId: string,
  placement: DropPlacement,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  if (sourceId === targetId) return null

  const ranges = topLevelBlockRanges(state.doc)
  const sourceRange = ranges.find((range) => blockId(range.node) === sourceId)
  const targetRange = ranges.find((range) => blockId(range.node) === targetId)
  if (!sourceRange || !targetRange) return null

  const sourceUnit = blockMoveUnitForRange(state.doc, sourceRange, collapsedBlockIds)
  const targetUnit = blockMoveTargetUnitForRange(state.doc, targetRange, sourceUnit, collapsedBlockIds)
  if (blockMoveUnitsOverlap(sourceUnit, targetUnit)) return null
  if (!canMoveUnitToTarget(sourceUnit, targetUnit)) return null

  const nextRanges = reorderedBlockMoveRanges(ranges, sourceUnit, targetUnit, placement)
  if (!nextRanges) return null

  const nextSourceIndex = nextRanges.findIndex((range) => range.from === sourceUnit.from)
  const nextSourcePosition = positionForTopLevelRangeIndex(nextRanges, nextSourceIndex)
  if (nextSourcePosition === null) return null
  const nextFrom = nextSourcePosition + (sourceRange.from - sourceUnit.from)
  const transaction = state.tr.replaceWith(0, state.doc.content.size, Fragment.fromArray(nextRanges.map((range) => range.node)))
  transaction.setSelection(movedBlockSelection(state, transaction.doc, sourceRange, nextFrom))
  return transaction
}

function indentListRangesTransaction(
  state: EditorState,
  ranges: readonly ActiveBlockRange[],
  direction: IndentDirection,
): Transaction | null {
  if (!canShiftListSubtree(ranges, direction)) return null

  const delta = direction === 'in' ? 1 : -1
  let transaction = state.tr
  for (const range of ranges) {
    transaction = transaction.setNodeMarkup(range.from, range.node.type, shiftedListAttrs(range.node.attrs, delta))
  }
  return transaction
}
