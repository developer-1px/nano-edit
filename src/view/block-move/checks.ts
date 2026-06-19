import type { EditorState } from 'prosemirror-state'
import {
  activeBlockRange,
  listSubtreeRanges,
  topLevelBlockRanges,
} from '../../entities/block/structure/nano-block-ranges'
import { isListLikeNode } from '../../entities/block/structure/nano-block-node-kind'
import type { IndentDirection, MoveDirection } from '../../commands/types'
import {
  blockMoveTargetUnit,
} from './target'
import {
  blockMoveUnitForRange,
} from './unit'
import {
  canIndentActiveListSubtree,
  canShiftListSubtree,
  selectedListIndentRanges,
} from '../list/transforms'

export function canMoveActiveBlock(
  state: EditorState,
  direction: MoveDirection,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): boolean {
  const block = activeBlockRange(state)
  if (!block) return false

  const ranges = topLevelBlockRanges(state.doc)
  const sourceUnit = blockMoveUnitForRange(state.doc, block, collapsedBlockIds)
  return blockMoveTargetUnit(state.doc, ranges, sourceUnit, direction, collapsedBlockIds) !== null
}

export function canIndentActiveBlock(
  state: EditorState,
  direction: IndentDirection,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): boolean {
  const selectedRanges = selectedListIndentRanges(state, collapsedBlockIds)
  if (selectedRanges.length > 1) return canShiftListSubtree(selectedRanges, direction)

  const block = activeBlockRange(state)
  if (!block || !isListLikeNode(block.node)) return false

  return canIndentActiveListSubtree(state.doc, listSubtreeRanges(state.doc, block), direction)
}
