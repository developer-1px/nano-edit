import type { ActiveBlockRange } from '../blocks/nano-block-structure'
import type { BlockMoveUnit } from './nano-view-block-move-unit'

export type DropPlacement = 'after' | 'before'

export function reorderedBlockMoveRanges(
  ranges: readonly ActiveBlockRange[],
  sourceUnit: BlockMoveUnit,
  targetUnit: BlockMoveUnit,
  placement: DropPlacement,
): ActiveBlockRange[] | null {
  const sourceIndex = topLevelRangeIndex(ranges, sourceUnit.from)
  const targetIndex = topLevelRangeIndex(ranges, targetUnit.from)
  if (sourceIndex < 0 || targetIndex < 0) return null

  const nextRanges = [...ranges]
  const [firstSource] = nextRanges.splice(sourceIndex, sourceUnit.ranges.length)
  if (!firstSource) return null

  const targetIndexAfterRemoval = nextRanges.findIndex((range) => range.from === targetUnit.from)
  if (targetIndexAfterRemoval < 0) return null

  const insertIndex = targetIndexAfterRemoval + (placement === 'after' ? targetUnit.ranges.length : 0)
  nextRanges.splice(insertIndex, 0, ...sourceUnit.ranges)
  return sameBlockRangeOrder(ranges, nextRanges) ? null : nextRanges
}

export function topLevelRangeIndex(ranges: readonly ActiveBlockRange[], from: number): number {
  return ranges.findIndex((range) => range.from === from)
}

export function positionForTopLevelRangeIndex(ranges: readonly ActiveBlockRange[], index: number): number | null {
  if (index < 0 || index > ranges.length) return null

  let position = 0
  for (let rangeIndex = 0; rangeIndex < index; rangeIndex += 1) {
    const range = ranges[rangeIndex]
    if (!range) return null
    position += range.node.nodeSize
  }
  return position
}

function sameBlockRangeOrder(left: readonly ActiveBlockRange[], right: readonly ActiveBlockRange[]): boolean {
  return left.length === right.length && left.every((range, index) => range.from === right[index]?.from)
}
