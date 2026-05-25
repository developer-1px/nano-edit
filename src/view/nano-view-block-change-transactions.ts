import { EditorState, type Transaction } from 'prosemirror-state'
import {
  type BlockTemplate,
} from '../blocks/nano-block-options'
import {
  activeBlockRange,
  topLevelBlockRanges,
  type ActiveBlockRange,
} from '../blocks/nano-block-structure'
import { selectionAfterReplacementContent } from '../core/nano-selection'
import { blockChangeReplacementWithContext } from './nano-view-block-change-context'
import { replacementNodeForBlockTemplate } from './nano-view-block-template-nodes'
import { normalizedBlockChangeContent } from './nano-view-list-transforms'

export function changeActiveBlockTransaction(
  state: EditorState,
  template: BlockTemplate,
): Transaction | null {
  const block = activeBlockRange(state)
  return block ? changeBlockRangeTransaction(state, block, template, state.selection.$from.parentOffset) : null
}

export function changeBlockByIdTransaction(
  state: EditorState,
  id: string,
  template: BlockTemplate,
): Transaction | null {
  const block = topLevelBlockRanges(state.doc).find((range) => range.node.attrs.id === id)
  return block ? changeBlockRangeTransaction(state, block, template, 0) : null
}

function changeBlockRangeTransaction(
  state: EditorState,
  block: ActiveBlockRange,
  template: BlockTemplate,
  selectionOffset: number,
): Transaction | null {
  const replacement = blockChangeReplacementWithContext(block.node, replacementNodeForBlockTemplate(template, block.node))
  if (!replacement) return null

  const change = normalizedBlockChangeContent(state.doc, block, replacement)
  const transaction = state.tr.replaceWith(block.from, change.to, change.content)
  transaction.setSelection(selectionAfterReplacementContent(transaction.doc, block.from, change.content, selectionOffset))
  return transaction
}
