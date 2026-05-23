import type { EditorState } from 'prosemirror-state'
import {
  blockId,
  headingSectionRanges,
  isHeadingNode,
  listSubtreeRanges,
  type ActiveBlockRange,
} from './nano-block-structure'

export interface BlockMoveUnit {
  from: number
  to: number
  ranges: ActiveBlockRange[]
}

export function blockMoveUnitForRange(
  doc: EditorState['doc'],
  range: ActiveBlockRange,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): BlockMoveUnit {
  const id = blockId(range.node)
  const unitRanges = id && collapsedBlockIds.has(id) && isHeadingNode(range.node)
    ? headingSectionRanges(doc, range)
    : listSubtreeRanges(doc, range)
  const ranges = unitRanges.length > 0 ? unitRanges : [range]
  return blockMoveUnitFromRanges(ranges) ?? {
    from: range.from,
    to: range.to,
    ranges: [range],
  }
}

export function blockMoveUnitFromRanges(ranges: readonly ActiveBlockRange[]): BlockMoveUnit | null {
  const first = ranges[0]
  const last = ranges.at(-1)
  if (!first || !last) return null

  return {
    from: first.from,
    to: last.to,
    ranges: [...ranges],
  }
}

export function blockMoveUnitsOverlap(left: BlockMoveUnit, right: BlockMoveUnit): boolean {
  return left.from < right.to && right.from < left.to
}

export function isHeadingSectionMoveUnit(unit: BlockMoveUnit): boolean {
  const first = unit.ranges[0]
  return unit.ranges.length > 1 && first !== undefined && isHeadingNode(first.node)
}
