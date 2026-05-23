import type { EditorState } from 'prosemirror-state'
import {
  headingSectionRanges,
  isHeadingNode,
  isListLikeNode,
  nodeIndent,
  type ActiveBlockRange,
} from './nano-block-structure'
import type { MoveDirection } from './nano-command-surface'
import {
  blockMoveUnitForRange,
  blockMoveUnitFromRanges,
  blockMoveUnitsOverlap,
  isHeadingSectionMoveUnit,
  type BlockMoveUnit,
} from './nano-view-block-move-unit'
import { topLevelRangeIndex } from './nano-view-block-reorder'

export function blockMoveTargetUnit(
  doc: EditorState['doc'],
  ranges: readonly ActiveBlockRange[],
  sourceUnit: BlockMoveUnit,
  direction: MoveDirection,
  collapsedBlockIds: ReadonlySet<string>,
): BlockMoveUnit | null {
  const sourceIndex = topLevelRangeIndex(ranges, sourceUnit.from)
  const targetIndex = direction === 'up'
    ? previousMoveTargetIndex(ranges, sourceUnit, sourceIndex)
    : sourceIndex + sourceUnit.ranges.length
  if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= ranges.length) return null

  const targetUnit = blockMoveTargetUnitForRange(doc, ranges[targetIndex]!, sourceUnit, collapsedBlockIds)
  if (blockMoveUnitsOverlap(sourceUnit, targetUnit)) return null
  return canMoveUnitToTarget(sourceUnit, targetUnit) ? targetUnit : null
}

export function canMoveUnitToTarget(sourceUnit: BlockMoveUnit, targetUnit: BlockMoveUnit): boolean {
  const source = sourceUnit.ranges[0]?.node
  const target = targetUnit.ranges[0]?.node
  if (!source || !target) return false

  const sourceIndent = isListLikeNode(source) ? nodeIndent(source) : 0
  const targetIndent = isListLikeNode(target) ? nodeIndent(target) : 0
  if (isListLikeNode(source)) return isListLikeNode(target) ? sourceIndent === targetIndent : sourceIndent === 0
  return !isListLikeNode(target) || targetIndent === 0
}

export function blockMoveTargetUnitForRange(
  doc: EditorState['doc'],
  range: ActiveBlockRange,
  sourceUnit: BlockMoveUnit,
  collapsedBlockIds: ReadonlySet<string>,
): BlockMoveUnit {
  if (isHeadingSectionMoveUnit(sourceUnit) && isHeadingNode(range.node)) {
    const headingUnit = blockMoveUnitFromRanges(headingSectionRanges(doc, range))
    if (headingUnit) return headingUnit
  }

  return blockMoveUnitForRange(doc, range, collapsedBlockIds)
}

function previousMoveTargetIndex(
  ranges: readonly ActiveBlockRange[],
  sourceUnit: BlockMoveUnit,
  sourceIndex: number,
): number {
  if (sourceIndex <= 0) return -1

  const source = sourceUnit.ranges[0]?.node
  if (source && isListLikeNode(source) && nodeIndent(source) > 0) {
    return previousListSiblingMoveTargetIndex(ranges, sourceIndex, nodeIndent(source))
  }

  const previousIndex = sourceIndex - 1
  const previous = ranges[previousIndex]!
  if (!isListLikeNode(previous.node)) return previousIndex

  let targetIndex = previousIndex
  let targetIndent = nodeIndent(previous.node)
  for (let index = previousIndex - 1; index >= 0; index -= 1) {
    const candidate = ranges[index]!
    if (!isListLikeNode(candidate.node)) break

    const indent = nodeIndent(candidate.node)
    if (indent < targetIndent) {
      targetIndex = index
      targetIndent = indent
    }
  }

  return targetIndex
}

function previousListSiblingMoveTargetIndex(
  ranges: readonly ActiveBlockRange[],
  sourceIndex: number,
  sourceIndent: number,
): number {
  for (let index = sourceIndex - 1; index >= 0; index -= 1) {
    const candidate = ranges[index]!
    if (!isListLikeNode(candidate.node)) return -1

    const indent = nodeIndent(candidate.node)
    if (indent > sourceIndent) continue
    return indent === sourceIndent ? index : -1
  }

  return -1
}
