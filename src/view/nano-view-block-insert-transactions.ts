import { EditorState, type Transaction } from 'prosemirror-state'
import {
  nextBlockId,
  type BlockTemplate,
} from '../blocks/nano-block-options'
import {
  activeBlockRange,
  listSubtreeEndPosition,
  topLevelBlockRanges,
  type ActiveBlockRange,
} from '../blocks/nano-block-structure'
import { selectionAfterInsertedContent } from '../core/nano-selection'
import { insertedNodeForBlockTemplate } from './nano-view-block-template-nodes'

export function insertParagraphAfterBlockTransaction(state: EditorState): Transaction | null {
  return insertBlockAfterActiveTransaction(state, { type: 'paragraph' })
}

export function insertBlockAfterIdTransaction(
  state: EditorState,
  id: string,
  template: BlockTemplate,
): Transaction | null {
  const block = topLevelBlockRanges(state.doc).find((range) => range.node.attrs.id === id)
  return block ? insertBlockAfterRangeTransaction(state, block, template) : null
}

export function insertBlockAfterActiveTransaction(
  state: EditorState,
  template: BlockTemplate,
): Transaction | null {
  const block = activeBlockRange(state)
  return block ? insertBlockAfterRangeTransaction(state, block, template) : null
}

function insertBlockAfterRangeTransaction(
  state: EditorState,
  block: ActiveBlockRange,
  template: BlockTemplate,
): Transaction | null {
  const id = nextBlockId(state.doc, block.node.attrs.id)
  const inserted = insertedNodeForBlockTemplate(template, id)
  if (!inserted) return null

  const insertAt = listSubtreeEndPosition(state.doc, block)
  const transaction = state.tr.replaceWith(insertAt, insertAt, inserted)
  transaction.setSelection(selectionAfterInsertedContent(transaction.doc, insertAt, inserted))
  return transaction
}
