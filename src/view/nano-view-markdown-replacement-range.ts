import type { EditorState } from 'prosemirror-state'
import {
  activeBlockRange,
  expandedBlockRangesWithCollapsedSubtrees,
  selectedBlockRangesWithCollapsedSubtree,
  topLevelBlockRanges,
} from '../blocks/nano-block-structure'

export function topLevelReplacementRange(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): { from: number; to: number } | null {
  if (state.selection.empty) {
    const block = activeBlockRange(state)
    if (!block) return null

    const ranges = selectedBlockRangesWithCollapsedSubtree(state.doc, block, collapsedBlockIds)
    const last = ranges[ranges.length - 1]
    return last ? { from: block.from, to: last.to } : { from: block.from, to: block.to }
  }

  const ranges = topLevelBlockRanges(state.doc).filter((block) =>
    block.to > state.selection.from && block.from < state.selection.to,
  )
  const first = ranges[0]
  const last = ranges[ranges.length - 1]
  if (!first || !last) return null

  const expandedRanges = expandedBlockRangesWithCollapsedSubtrees(state.doc, ranges, collapsedBlockIds)
  const expandedLast = expandedRanges[expandedRanges.length - 1]
  return expandedLast ? { from: first.from, to: expandedLast.to } : { from: first.from, to: last.to }
}
