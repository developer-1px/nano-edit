import type { Command } from 'prosemirror-state'
import type { NanoViewContext } from '../runtime/context'
import { deleteSelectedBlockTransaction } from '../block-edit/duplicate-delete'
import {
  backspaceBlockTransaction,
  backspaceListSubtreeTransaction,
  deleteBlockSyntaxTransaction,
} from './enter'
import {
  inlineMarkBoundaryTransaction,
  inlineSourceTokenDeleteTransaction,
} from './inline-boundary'
import { selectedAtomSourceTransaction } from '../markdown-source/selected-atom'

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
