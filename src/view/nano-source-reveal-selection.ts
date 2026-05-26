import type { EditorState } from 'prosemirror-state'

export function selectionTouchesBlock(state: EditorState, from: number, to: number): boolean {
  if (state.selection.empty) {
    return state.selection.head >= from && state.selection.head <= to
  }

  return state.selection.ranges.some((range) => rangesIntersect(range.$from.pos, range.$to.pos, from, to))
}

export function selectionTouchesInlineRange(
  state: EditorState,
  contentFrom: number,
  from: number,
  to: number,
): boolean {
  if (state.selection.empty) {
    const cursor = state.selection.head - contentFrom
    return cursor >= from && cursor <= to
  }

  return state.selection.ranges.some((range) => {
    const selectionFrom = range.$from.pos - contentFrom
    const selectionTo = range.$to.pos - contentFrom
    return rangesIntersect(selectionFrom, selectionTo, from, to)
  })
}

function rangesIntersect(leftFrom: number, leftTo: number, rightFrom: number, rightTo: number): boolean {
  return leftFrom < rightTo && leftTo > rightFrom
}
