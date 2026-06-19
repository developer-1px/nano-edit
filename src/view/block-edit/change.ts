import { EditorState, type Transaction } from 'prosemirror-state'
import type { BlockTemplate } from '../../assembly/capability'
import type { BlockOptionRegistry } from '../../blocks/nano-block-options'
import {
  activeBlockRange,
  topLevelBlockRanges,
} from '../../entities/block/structure/nano-block-ranges'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import type { ActiveBlockRange } from '../../entities/block/structure/nano-block-structure-types'
import { selectionAfterReplacementContent } from '../selection/placement'
import { blockChangeReplacementWithContext } from './change-context'
import { replacementNodeForBlockTemplate } from '../block-template/nodes'
import { normalizedBlockChangeContent } from '../list/transforms'

export function changeActiveBlockTransaction(
  state: EditorState,
  template: BlockTemplate,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = activeBlockRange(state)
  return block ? changeBlockRangeTransaction(state, block, template, state.selection.$from.parentOffset, registry) : null
}

export function changeBlockByIdTransaction(
  state: EditorState,
  id: string,
  template: BlockTemplate,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = topLevelBlockRanges(state.doc).find((range) => blockId(range.node) === id)
  return block ? changeBlockRangeTransaction(state, block, template, 0, registry) : null
}

function changeBlockRangeTransaction(
  state: EditorState,
  block: ActiveBlockRange,
  template: BlockTemplate,
  selectionOffset: number,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const replacement = blockChangeReplacementWithContext(block.node, replacementNodeForBlockTemplate(template, block.node, registry))
  if (!replacement) return null

  const change = normalizedBlockChangeContent(state.doc, block, replacement)
  const transaction = state.tr.replaceWith(block.from, change.to, change.content)
  transaction.setSelection(selectionAfterReplacementContent(transaction.doc, block.from, change.content, selectionOffset))
  return transaction
}
