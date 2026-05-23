import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import {
  listSubtreeRanges,
  nodeIndent,
  type ActiveBlockRange,
} from './nano-block-structure'
import { nanoNodeNames } from './prosemirror-nano'
import { indentActiveBlockTransaction } from './nano-view-block-move-transactions'
import { liftedListSubtreeNodes } from './nano-view-list-transforms'

export function exitListSubtreeTransaction(
  state: EditorState,
  blockPosition: number,
  blockNode: ProseMirrorNode,
): Transaction | null {
  const block = { from: blockPosition, to: blockPosition + blockNode.nodeSize, node: blockNode }
  if (nodeIndent(blockNode) > 0) return indentActiveBlockTransaction(state, 'out')

  return convertListRootToParagraphTransaction(state, block)
}

function convertListRootToParagraphTransaction(
  state: EditorState,
  block: ActiveBlockRange,
): Transaction | null {
  const paragraphType = state.schema.nodes[nanoNodeNames.paragraph]
  if (!paragraphType) return null

  const subtree = listSubtreeRanges(state.doc, block)
  const paragraph = paragraphType.create({ id: block.node.attrs.id }, block.node.content, block.node.marks)
  const liftedChildren = liftedListSubtreeNodes(subtree.slice(1), nodeIndent(block.node) + 1)
  const content = Fragment.fromArray([paragraph, ...liftedChildren])
  const to = subtree[subtree.length - 1]?.to ?? block.to
  const transaction = state.tr.replaceWith(block.from, to, content)
  transaction.setSelection(TextSelection.create(transaction.doc, block.from + 1))
  return transaction
}
