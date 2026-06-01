import type { Command, EditorState, Transaction } from 'prosemirror-state'
import type { BlockTemplate } from '../../blocks/nano-block-options'
import type { IndentDirection, MoveDirection } from '../shell/shell'
import type { NanoViewContext } from '../runtime/context'
import {
  changeActiveBlockTransaction,
  deleteActiveBlockTransaction,
  deleteSelectedBlockTransaction,
  duplicateActiveBlockTransaction,
  insertBlockAfterActiveTransaction,
  selectActiveBlockTransaction,
  selectAdjacentBlockTransaction,
} from '../block-edit/index'
import {
  indentActiveBlockTransaction,
  moveActiveBlockTransaction,
} from '../block-move/transactions'

export function transactionCommand(transactionForState: (state: EditorState) => Transaction | null): Command {
  return (state, dispatch) => {
    const transaction = transactionForState(state)
    if (!transaction) return false

    if (dispatch) dispatch(transaction.scrollIntoView())
    return true
  }
}

export function insertBlockAfterActiveCommand(ctx: NanoViewContext, template: BlockTemplate): Command {
  return transactionCommand((state) => insertBlockAfterActiveTransaction(state, template, ctx.blockRegistry))
}

export function changeActiveBlockCommand(ctx: NanoViewContext, template: BlockTemplate): Command {
  return transactionCommand((state) => changeActiveBlockTransaction(state, template, ctx.blockRegistry))
}

export function duplicateActiveBlockCommand(): Command {
  return transactionCommand(duplicateActiveBlockTransaction)
}

export function deleteActiveBlockCommand(ctx: NanoViewContext): Command {
  return transactionCommand((state) => deleteActiveBlockTransaction(state, ctx.collapsedBlockIds))
}

export function deleteSelectedBlockCommand(ctx: NanoViewContext): Command {
  return transactionCommand((state) => deleteSelectedBlockTransaction(state, ctx.collapsedBlockIds))
}

export function selectActiveBlockCommand(): Command {
  return transactionCommand(selectActiveBlockTransaction)
}

export function selectAdjacentBlockCommand(ctx: NanoViewContext, direction: MoveDirection): Command {
  return transactionCommand((state) => selectAdjacentBlockTransaction(state, direction, ctx.collapsedBlockIds))
}

export function moveActiveBlockCommand(ctx: NanoViewContext, direction: MoveDirection): Command {
  return transactionCommand((state) => moveActiveBlockTransaction(state, direction, ctx.collapsedBlockIds))
}

export function indentActiveBlockCommand(ctx: NanoViewContext, direction: IndentDirection): Command {
  return transactionCommand((state) => indentActiveBlockTransaction(state, direction, ctx.collapsedBlockIds))
}
