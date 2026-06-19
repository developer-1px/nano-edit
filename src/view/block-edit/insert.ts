import { EditorState, type Transaction } from 'prosemirror-state'
import type { BlockTemplate } from '../../assembly/capability'
import type { BlockOptionRegistry } from '../../blocks/nano-block-options'
import { nextBlockId } from '../../capabilities/block-behavior-id'
import {
  activeBlockRange,
  listSubtreeEndPosition,
} from '../../entities/block/structure/nano-block-ranges'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import type { ActiveBlockRange } from '../../entities/block/structure/nano-block-structure-types'
import { selectionAfterInsertedContent } from '../selection/placement'
import { insertedNodeForBlockTemplate } from '../block-template/nodes'

export function insertBlockAfterActiveTransaction(
  state: EditorState,
  template: BlockTemplate,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = activeBlockRange(state)
  return block ? insertBlockAfterRangeTransaction(state, block, template, registry) : null
}

function insertBlockAfterRangeTransaction(
  state: EditorState,
  block: ActiveBlockRange,
  template: BlockTemplate,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const id = nextBlockId(state.doc, blockId(block.node))
  const inserted = insertedNodeForBlockTemplate(template, id, registry)
  if (!inserted) return null

  const insertAt = listSubtreeEndPosition(state.doc, block)
  const transaction = state.tr.replaceWith(insertAt, insertAt, inserted)
  transaction.setSelection(selectionAfterInsertedContent(transaction.doc, insertAt, inserted))
  return transaction
}
