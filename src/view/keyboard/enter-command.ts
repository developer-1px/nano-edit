import type { Command } from 'prosemirror-state'
import type { NanoViewContext } from '../runtime/context'
import {
  blockEnterShortcutTransaction,
  enterBlockTransaction,
  enterListParentEndTransaction,
  enterListSubtreeTransaction,
  enterSelectedBlockTransaction,
  splitTextblockTransaction,
  trailingReferenceMarkTransaction,
} from './transactions'

export function enterKeyCommand(ctx: NanoViewContext): Command {
  return (state, dispatch, view) => {
    const selectedBlockTransaction = enterSelectedBlockTransaction(state, ctx.blockRegistry)
    if (selectedBlockTransaction) {
      if (dispatch) dispatch(selectedBlockTransaction.scrollIntoView())
      return true
    }

    const shortcutTransaction = blockEnterShortcutTransaction(state, ctx.blockRegistry)
    if (shortcutTransaction) {
      if (dispatch) dispatch(shortcutTransaction.scrollIntoView())
      return true
    }

    const trailingReferenceTransaction = trailingReferenceMarkTransaction(state)
    if (trailingReferenceTransaction) {
      if (!dispatch) return true

      dispatch(trailingReferenceTransaction)
      const nextState = view?.state ?? state.apply(trailingReferenceTransaction)
      const enterTransaction = enterBlockTransaction(nextState, ctx.blockRegistry) ?? splitTextblockTransaction(nextState)
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

    const transaction = enterBlockTransaction(state, ctx.blockRegistry)
    if (!transaction) return false

    if (dispatch) dispatch(transaction.scrollIntoView())
    return true
  }
}
