import type { Command } from 'prosemirror-state'
import type { NanoViewContext } from './nano-view-context'
import { deleteSelectedBlockTransaction } from './nano-view-block-edit-transactions'
import {
  backspaceBlockTransaction,
  backspaceListSubtreeTransaction,
  deleteBlockSyntaxTransaction,
  inlineMarkBoundaryTransaction,
  inlineSourceTokenDeleteTransaction,
  selectedAtomSourceTransaction,
} from './nano-view-keyboard-transactions'

export function backspaceKeyCommand(ctx: NanoViewContext): Command {
  return (state, dispatch) => {
    const atomSourceTransaction = selectedAtomSourceTransaction(state)
    if (atomSourceTransaction) {
      if (dispatch) dispatch(atomSourceTransaction.scrollIntoView())
      return true
    }

    const selectedBlockTransaction = deleteSelectedBlockTransaction(state, ctx.collapsedBlockIds)
    if (selectedBlockTransaction) {
      if (dispatch) dispatch(selectedBlockTransaction.scrollIntoView())
      return true
    }

    const inlineMarkTransaction = inlineSourceTokenDeleteTransaction(state, 'backward')
      ?? inlineMarkBoundaryTransaction(state, 'backward')
    if (inlineMarkTransaction) {
      if (dispatch) dispatch(inlineMarkTransaction.scrollIntoView())
      return true
    }

    const listExitTransaction = backspaceListSubtreeTransaction(state)
    if (listExitTransaction) {
      if (dispatch) dispatch(listExitTransaction.scrollIntoView())
      return true
    }

    const transaction = backspaceBlockTransaction(state, ctx.blockRegistry)
    if (!transaction) return false

    if (dispatch) dispatch(transaction.scrollIntoView())
    return true
  }
}

export function deleteKeyCommand(ctx: NanoViewContext): Command {
  return (state, dispatch) => {
    const atomSourceTransaction = selectedAtomSourceTransaction(state)
    if (atomSourceTransaction) {
      if (dispatch) dispatch(atomSourceTransaction.scrollIntoView())
      return true
    }

    const selectedBlockTransaction = deleteSelectedBlockTransaction(state, ctx.collapsedBlockIds)
    if (selectedBlockTransaction) {
      if (dispatch) dispatch(selectedBlockTransaction.scrollIntoView())
      return true
    }

    const inlineMarkTransaction = inlineSourceTokenDeleteTransaction(state, 'forward')
      ?? inlineMarkBoundaryTransaction(state, 'forward')
    if (inlineMarkTransaction) {
      if (dispatch) dispatch(inlineMarkTransaction.scrollIntoView())
      return true
    }

    const listExitTransaction = backspaceListSubtreeTransaction(state)
    if (listExitTransaction) {
      if (dispatch) dispatch(listExitTransaction.scrollIntoView())
      return true
    }

    const transaction = deleteBlockSyntaxTransaction(state, ctx.blockRegistry)
    if (!transaction) return false

    if (dispatch) dispatch(transaction.scrollIntoView())
    return true
  }
}
