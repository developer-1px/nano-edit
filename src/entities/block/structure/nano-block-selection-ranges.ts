import { EditorState, NodeSelection } from 'prosemirror-state'
import { blockId } from './nano-block-node-kind'
import {
  activeBlockRange,
  blockSubtreeRanges,
  topLevelBlockRanges,
} from './nano-block-ranges'
import type { ActiveBlockRange } from './nano-block-structure-types'

export function selectedWholeBlockRanges(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): ActiveBlockRange[] {
  if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
    const block = activeBlockRange(state)
    return block ? selectedBlockRangesWithCollapsedSubtree(state.doc, block, collapsedBlockIds) : []
  }

  if (state.selection.empty) return []

  const ranges = topLevelBlockRanges(state.doc).filter((block) =>
    block.to > state.selection.from && block.from < state.selection.to,
  )
  const first = ranges[0]
  const last = ranges[ranges.length - 1]
  if (!first || !last) return []
  if (state.selection.from > first.from || state.selection.to < last.to) return []

  return expandedBlockRangesWithCollapsedSubtrees(state.doc, ranges, collapsedBlockIds)
}

export function selectedBlockRangesWithCollapsedSubtree(
  doc: Parameters<typeof blockSubtreeRanges>[0],
  block: ActiveBlockRange,
  collapsedBlockIds: ReadonlySet<string>,
): ActiveBlockRange[] {
  const id = blockId(block.node)
  if (!id || !collapsedBlockIds.has(id)) return [block]

  return blockSubtreeRanges(doc, block)
}

export function expandedBlockRangesWithCollapsedSubtrees(
  doc: Parameters<typeof blockSubtreeRanges>[0],
  ranges: readonly ActiveBlockRange[],
  collapsedBlockIds: ReadonlySet<string>,
): ActiveBlockRange[] {
  const expanded: ActiveBlockRange[] = []
  let coveredTo = -1

  for (const range of ranges) {
    if (range.from < coveredTo) continue

    const nextRanges = selectedBlockRangesWithCollapsedSubtree(doc, range, collapsedBlockIds)
    expanded.push(...nextRanges)
    coveredTo = Math.max(coveredTo, nextRanges[nextRanges.length - 1]?.to ?? range.to)
  }

  return expanded
}
