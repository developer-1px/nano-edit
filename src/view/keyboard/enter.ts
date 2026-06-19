import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import { blockBehaviorForNode, type BlockOptionRegistry } from '../../blocks/nano-block-options'
import { nextBlockId } from '../../capabilities/block-behavior-id'
import { blockKeyboardContext } from '../../blocks/options/keyboard-context'
import {
  blockId,
  isListLikeNode,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../../entities/block/structure/nano-block-node-kind'
import {
  listSubtreeEndPosition,
  listSubtreeRanges,
} from '../../entities/block/structure/nano-block-ranges'
import type { ActiveBlockRange } from '../../entities/block/structure/nano-block-structure-types'
import { continuationTodoNodeAfterParentEnd } from '../../capabilities/todo/view'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { indentText } from '../../capabilities/block-indent-values'
import {
  nextOrderedStartAttrs,
} from '../../codecs/markdown/nano-markdown-list-attrs'
import {
  bulletMarker,
  orderedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'
import { insertBlockAfterActiveTransaction } from '../block-edit/insert'
import { indentActiveBlockTransaction } from '../block-move/transactions'
import { liftedListSubtreeNodes } from '../list/transforms'
import { continuationMarkerBackspaceTransaction } from './continuation-marker'

export function enterBlockTransaction(
  state: EditorState,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context) return null

  const behavior = registry
    ? registry.blockBehaviorForNode(context.block)
    : blockBehaviorForNode(context.block)
  return behavior?.enter?.(context) ?? null
}

export function enterListSubtreeTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context || !isListLikeNode(context.block) || context.block.textContent.length > 0) return null

  return exitListSubtreeTransaction(state, context.blockPosition, context.block)
}

export function enterListParentEndTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context || !isListLikeNode(context.block) || context.block.textContent.length === 0) return null
  if (context.$from.parentOffset !== context.block.textContent.length) return null

  const block = { from: context.blockPosition, to: context.blockPosition + context.block.nodeSize, node: context.block }
  const subtreeEnd = listSubtreeEndPosition(state.doc, block)
  if (subtreeEnd === block.to) return null

  const inserted = continuationListNodeAfterParentEnd(state.doc, context.block)
  if (!inserted) return null

  const transaction = state.tr.replaceWith(subtreeEnd, subtreeEnd, inserted)
  transaction.setSelection(TextSelection.create(transaction.doc, subtreeEnd + 1))
  return transaction
}

export function enterSelectedBlockTransaction(
  state: EditorState,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null

  if (selection.node.isTextblock) {
    return state.tr.setSelection(TextSelection.create(state.doc, selection.to - 1))
  }

  return insertBlockAfterActiveTransaction(state, { type: 'paragraph' }, registry)
}

export function backspaceBlockTransaction(
  state: EditorState,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context) return null

  const continuationTransaction = continuationMarkerBackspaceTransaction(context)
  if (continuationTransaction) return continuationTransaction

  const behavior = registry
    ? registry.blockBehaviorForNode(context.block)
    : blockBehaviorForNode(context.block)
  return behavior?.backspaceAtStart?.(context) ?? null
}

export function deleteBlockSyntaxTransaction(
  state: EditorState,
  registry?: BlockOptionRegistry,
): Transaction | null {
  return backspaceBlockTransaction(state, registry)
}

export function backspaceListSubtreeTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context || context.$from.parentOffset !== 0 || !isListLikeNode(context.block)) return null

  return exitListSubtreeTransaction(state, context.blockPosition, context.block)
}

export function splitTextblockTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context) return null

  const id = nextBlockId(state.doc, blockId(context.block))
  const splitOffset = context.$from.parentOffset
  const before = context.block.type.create(context.block.attrs, context.block.content.cut(0, splitOffset))
  const after = context.block.type.create({ ...context.block.attrs, id }, context.block.content.cut(splitOffset))
  const transaction = context.state.tr.replaceWith(
    context.blockPosition,
    context.blockPosition + context.block.nodeSize,
    Fragment.fromArray([before, after]),
  )
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + before.nodeSize + 1))
  return transaction
}

function exitListSubtreeTransaction(
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
  const paragraph = paragraphType.create({ id: blockId(block.node) || null }, block.node.content, block.node.marks)
  const liftedChildren = liftedListSubtreeNodes(subtree.slice(1), nodeIndent(block.node) + 1)
  const content = Fragment.fromArray([paragraph, ...liftedChildren])
  const to = subtree[subtree.length - 1]?.to ?? block.to
  const transaction = state.tr.replaceWith(block.from, to, content)
  transaction.setSelection(TextSelection.create(transaction.doc, block.from + 1))
  return transaction
}

function continuationListNodeAfterParentEnd(
  doc: ProseMirrorNode,
  source: ProseMirrorNode,
): ProseMirrorNode | null {
  const id = nextBlockId(doc, blockId(source))
  const indent = nodeIndent(source)
  if (source.type.name === nanoNodeNames.todo) {
    return continuationTodoNodeAfterParentEnd(source, id, indent)
  }
  if (source.type.name !== nanoNodeNames.listItem) return null

  const kind = source.attrs.kind === 'ordered' ? 'ordered' : 'bullet'
  return source.type.create({
    id,
    kind,
    indent,
    indentText: indentText(source.attrs.indentText),
    marker: kind === 'bullet' ? bulletMarker(source.attrs.marker) : '-',
    orderedMarker: kind === 'ordered' ? orderedMarker(source.attrs.orderedMarker) : '.',
    ...(kind === 'ordered' ? nextOrderedNodeStartAttrs(source) : {}),
  })
}

function nextOrderedNodeStartAttrs(node: ProseMirrorNode): { orderedStartText?: string; start?: number } {
  const start = nodeOrderedStart(node)
  return start === null ? {} : nextOrderedStartAttrs(start, nodeOrderedStartText(node))
}
