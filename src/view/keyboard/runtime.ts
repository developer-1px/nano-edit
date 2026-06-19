import type { Command, EditorState, Transaction } from 'prosemirror-state'
import { blockKeyBindingEntries } from '../../blocks/nano-block-options'
import type { BlockKeyBindingEntry, BlockTemplate } from '../../assembly/capability'
import { markCommand } from '../../marks/commands'
import { markKeyBindingEntries } from '../../marks/queries'
import type { IndentDirection, MoveDirection } from '../../commands/types'
import { activeBlockId } from '../selection/active-block'
import { changeActiveBlockTransaction } from '../block-edit/change'
import {
  deleteActiveBlockTransaction,
  deleteSelectedBlockTransaction,
  duplicateActiveBlockTransaction,
} from '../block-edit/duplicate-delete'
import {
  insertBlockAfterActiveTransaction,
} from '../block-edit/insert'
import {
  selectActiveBlockTransaction,
  selectAdjacentBlockTransaction,
} from '../block-edit/selection'
import {
  indentActiveBlockTransaction,
  moveActiveBlockTransaction,
} from '../block-move/transactions'
import { backspaceKeyCommand, deleteKeyCommand } from './backspace'
import { enterKeyCommand } from './enter-command'
import type { NanoViewContext } from '../runtime/context'

interface NanoKeymapActions {
  focusActiveMarkdownSource: () => boolean
  restoreHistory: (direction: 'undo' | 'redo') => void
}

interface BlockKeymapCommands {
  changeActiveBlockCommand: (template: BlockTemplate) => Command
  insertBlockAfterActiveCommand: (template: BlockTemplate) => Command
}

export interface NanoKeymapRuntime {
  backspaceCommand: () => Command
  blockKeymapCommands: () => Record<string, Command>
  changeActiveBlockCommand: (template: BlockTemplate) => Command
  deleteCommand: () => Command
  deleteActiveBlockCommand: () => Command
  deleteSelectedBlockCommand: () => Command
  duplicateActiveBlockCommand: () => Command
  enterCommand: () => Command
  focusActiveMarkdownSourceCommand: () => Command
  historyCommand: (direction: 'undo' | 'redo') => Command
  indentActiveBlockCommand: (direction: IndentDirection) => Command
  insertBlockAfterActiveCommand: (template: BlockTemplate) => Command
  markKeymapCommands: () => Record<string, Command>
  moveActiveBlockCommand: (direction: MoveDirection) => Command
  openCommandPaletteCommand: () => Command
  selectActiveBlockCommand: () => Command
  selectAdjacentBlockCommand: (direction: MoveDirection) => Command
}

export function createNanoKeymapRuntime(
  ctx: NanoViewContext,
  actions: NanoKeymapActions,
): NanoKeymapRuntime {
  const blockCommands = {
    changeActiveBlockCommand: (template: BlockTemplate) => changeActiveBlockCommand(ctx, template),
    deleteCommand: () => deleteKeyCommand(ctx),
    deleteActiveBlockCommand: () => deleteActiveBlockCommand(ctx),
    deleteSelectedBlockCommand: () => deleteSelectedBlockCommand(ctx),
    duplicateActiveBlockCommand,
    indentActiveBlockCommand: (direction: IndentDirection) => indentActiveBlockCommand(ctx, direction),
    insertBlockAfterActiveCommand: (template: BlockTemplate) => insertBlockAfterActiveCommand(ctx, template),
    moveActiveBlockCommand: (direction: MoveDirection) => moveActiveBlockCommand(ctx, direction),
    selectActiveBlockCommand,
    selectAdjacentBlockCommand: (direction: MoveDirection) => selectAdjacentBlockCommand(ctx, direction),
  }

  return {
    backspaceCommand: () => backspaceKeyCommand(ctx),
    blockKeymapCommands: () => blockKeymapCommands(blockCommands, ctx.blockRegistry.blockKeyBindingEntries()),
    changeActiveBlockCommand: blockCommands.changeActiveBlockCommand,
    deleteCommand: blockCommands.deleteCommand,
    deleteActiveBlockCommand: blockCommands.deleteActiveBlockCommand,
    deleteSelectedBlockCommand: blockCommands.deleteSelectedBlockCommand,
    duplicateActiveBlockCommand,
    enterCommand: () => enterKeyCommand(ctx),
    focusActiveMarkdownSourceCommand: () => () => actions.focusActiveMarkdownSource(),
    historyCommand: (direction) => () => {
      actions.restoreHistory(direction)
      return true
    },
    indentActiveBlockCommand: blockCommands.indentActiveBlockCommand,
    insertBlockAfterActiveCommand: blockCommands.insertBlockAfterActiveCommand,
    markKeymapCommands,
    moveActiveBlockCommand: blockCommands.moveActiveBlockCommand,
    openCommandPaletteCommand: () => () => {
      ctx.shell.openCommandPalette('global', activeBlockId(ctx.view.state))
      return true
    },
    selectActiveBlockCommand,
    selectAdjacentBlockCommand: blockCommands.selectAdjacentBlockCommand,
  }
}

function markKeymapCommands(): Record<string, Command> {
  return Object.fromEntries(markKeyBindingEntries().map(({ option, keyBinding }) => [
    keyBinding,
    markCommand(option),
  ]))
}

function blockKeymapCommands(
  commands: BlockKeymapCommands,
  entries: readonly BlockKeyBindingEntry[] = blockKeyBindingEntries(),
): Record<string, Command> {
  return Object.fromEntries(entries.flatMap(({ option, keyBinding }) => {
    if (!option.template) return []

    return [[
      keyBinding.key,
      keyBinding.action === 'insertAfterActive'
        ? commands.insertBlockAfterActiveCommand(option.template)
        : commands.changeActiveBlockCommand(option.template),
    ]]
  }))
}

function transactionCommand(transactionForState: (state: EditorState) => Transaction | null): Command {
  return (state, dispatch) => {
    const transaction = transactionForState(state)
    if (!transaction) return false

    if (dispatch) dispatch(transaction.scrollIntoView())
    return true
  }
}

function insertBlockAfterActiveCommand(ctx: NanoViewContext, template: BlockTemplate): Command {
  return transactionCommand((state) => insertBlockAfterActiveTransaction(state, template, ctx.blockRegistry))
}

function changeActiveBlockCommand(ctx: NanoViewContext, template: BlockTemplate): Command {
  return transactionCommand((state) => changeActiveBlockTransaction(state, template, ctx.blockRegistry))
}

function duplicateActiveBlockCommand(): Command {
  return transactionCommand(duplicateActiveBlockTransaction)
}

function deleteActiveBlockCommand(ctx: NanoViewContext): Command {
  return transactionCommand((state) => deleteActiveBlockTransaction(state, ctx.collapsedBlockIds))
}

function deleteSelectedBlockCommand(ctx: NanoViewContext): Command {
  return transactionCommand((state) => deleteSelectedBlockTransaction(state, ctx.collapsedBlockIds))
}

function selectActiveBlockCommand(): Command {
  return transactionCommand(selectActiveBlockTransaction)
}

function selectAdjacentBlockCommand(ctx: NanoViewContext, direction: MoveDirection): Command {
  return transactionCommand((state) => selectAdjacentBlockTransaction(state, direction, ctx.collapsedBlockIds))
}

function moveActiveBlockCommand(ctx: NanoViewContext, direction: MoveDirection): Command {
  return transactionCommand((state) => moveActiveBlockTransaction(state, direction, ctx.collapsedBlockIds))
}

function indentActiveBlockCommand(ctx: NanoViewContext, direction: IndentDirection): Command {
  return transactionCommand((state) => indentActiveBlockTransaction(state, direction, ctx.collapsedBlockIds))
}
