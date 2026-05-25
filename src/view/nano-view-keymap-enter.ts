import type { Command } from 'prosemirror-state'
import {
  blockEnterShortcutTransaction,
  enterBlockTransaction,
  enterListParentEndTransaction,
  enterListSubtreeTransaction,
  enterSelectedBlockTransaction,
  splitTextblockTransaction,
  trailingReferenceMarkTransaction,
} from './nano-view-keyboard-transactions'

export function enterKeyCommand(): Command {
  return (state, dispatch, view) => {
    const selectedBlockTransaction = enterSelectedBlockTransaction(state)
    if (selectedBlockTransaction) {
      if (dispatch) dispatch(selectedBlockTransaction.scrollIntoView())
      return true
    }

    const shortcutTransaction = blockEnterShortcutTransaction(state)
    if (shortcutTransaction) {
      if (dispatch) dispatch(shortcutTransaction.scrollIntoView())
      return true
    }

    const trailingReferenceTransaction = trailingReferenceMarkTransaction(state)
    if (trailingReferenceTransaction) {
      if (!dispatch) return true

      dispatch(trailingReferenceTransaction)
      const nextState = view?.state ?? state.apply(trailingReferenceTransaction)
      const enterTransaction = enterBlockTransaction(nextState) ?? splitTextblockTransaction(nextState)
      if (enterTransaction) dispatch(enterTransaction.scrollIntoView())
      return true
    }

    const listExitTransaction = enterListSubtreeTransaction(state)
    if (listExitTransaction) {
      if (dispatch) dispatch(listExitTransaction.scrollIntoView())
      return true
    }

    const listParentEndTransaction = enterListParentEndTransaction(state)
    if (listParentEndTransaction) {
      if (dispatch) dispatch(listParentEndTransaction.scrollIntoView())
      return true
    }

    const transaction = enterBlockTransaction(state)
    if (!transaction) return false

    if (dispatch) dispatch(transaction.scrollIntoView())
    return true
  }
}
