import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import {
  blockBehaviorForNode,
  blockKeyboardContext,
  nextBlockId,
} from '../blocks/nano-block-options'
import {
  isListLikeNode,
  listSubtreeEndPosition,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../blocks/nano-block-structure'
import { continuationTodoNodeAfterParentEnd } from '../capabilities/todo/view'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-nano'
import {
  indentText,
  markdownBulletMarker,
  markdownOrderedListMarker,
  nextOrderedStartAttrs,
} from './nano-view-block-template-markdown'
import { insertBlockAfterActiveTransaction } from './nano-view-block-edit-transactions'
import { exitListSubtreeTransaction } from './nano-view-keyboard-list-exit'
import { continuationMarkerBackspaceTransaction } from './nano-view-continuation-markers'

export function enterBlockTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context) return null

  return blockBehaviorForNode(context.block)?.enter?.(context) ?? null
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

export function enterSelectedBlockTransaction(state: EditorState): Transaction | null {
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !selection.node.isBlock) return null

  if (selection.node.isTextblock) {
    return state.tr.setSelection(TextSelection.create(state.doc, selection.to - 1))
  }

  return insertBlockAfterActiveTransaction(state, { type: 'paragraph' })
}

export function backspaceBlockTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context) return null

  const continuationTransaction = continuationMarkerBackspaceTransaction(context)
  if (continuationTransaction) return continuationTransaction

  return blockBehaviorForNode(context.block)?.backspaceAtStart?.(context) ?? null
}

export function deleteBlockSyntaxTransaction(state: EditorState): Transaction | null {
  return backspaceBlockTransaction(state)
}

export function backspaceListSubtreeTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context || context.$from.parentOffset !== 0 || !isListLikeNode(context.block)) return null

  return exitListSubtreeTransaction(state, context.blockPosition, context.block)
}

export function splitTextblockTransaction(state: EditorState): Transaction | null {
  const context = blockKeyboardContext(state)
  if (!context) return null

  const id = nextBlockId(state.doc, context.block.attrs.id)
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

function continuationListNodeAfterParentEnd(
  doc: ProseMirrorNode,
  source: ProseMirrorNode,
): ProseMirrorNode | null {
  const id = nextBlockId(doc, source.attrs.id)
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
    marker: kind === 'bullet' ? markdownBulletMarker(source.attrs.marker) : '-',
    orderedMarker: kind === 'ordered' ? markdownOrderedListMarker(source.attrs.orderedMarker) : '.',
    ...(kind === 'ordered' ? nextOrderedNodeStartAttrs(source) : {}),
  })
}

function nextOrderedNodeStartAttrs(node: ProseMirrorNode): { orderedStartText?: string; start?: number } {
  const start = nodeOrderedStart(node)
  return start === null ? {} : nextOrderedStartAttrs(start, nodeOrderedStartText(node))
}
