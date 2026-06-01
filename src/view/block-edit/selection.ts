import { EditorState, NodeSelection, type Transaction } from 'prosemirror-state'
import {
  blockClickOptionForNode,
} from '../../blocks/nano-block-options'
import {
  activeBlockRange,
  visibleTopLevelBlockRanges,
} from '../../blocks/nano-block-structure'
import type { MoveDirection } from '../shell/shell'

export function toggleBlockClickTransaction(state: EditorState, position: number): Transaction | null {
  const node = state.doc.nodeAt(position)
  const option = node ? blockClickOptionForNode(node) : null
  if (!option) return null

  return option.click.transaction(state, position)
}

export function toggleTodoTransaction(state: EditorState, position: number): Transaction | null {
  return toggleBlockClickTransaction(state, position)
}

export function selectActiveBlockTransaction(state: EditorState): Transaction | null {
  if (state.selection instanceof NodeSelection) return null

  const block = activeBlockRange(state)
  if (!block) return null

  return state.tr.setSelection(NodeSelection.create(state.doc, block.from))
}

export function selectAdjacentBlockTransaction(
  state: EditorState,
  direction: MoveDirection,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null

  const blocks = visibleTopLevelBlockRanges(state.doc, collapsedBlockIds)
  const index = blocks.findIndex((block) => block.from === selection.from)
  const next = blocks[index + (direction === 'up' ? -1 : 1)]
  return next ? state.tr.setSelection(NodeSelection.create(state.doc, next.from)) : null
}
