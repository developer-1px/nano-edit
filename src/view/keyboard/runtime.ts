import type { Command } from 'prosemirror-state'
import type { BlockTemplate } from '../../blocks/nano-block-options'
import type { IndentDirection, MoveDirection } from '../shell/shell'
import { activeBlockId } from '../selection/active-block'
import { backspaceKeyCommand, deleteKeyCommand } from './backspace'
import { enterKeyCommand } from './enter-command'
import {
  blockKeymapCommands,
  markKeymapCommands,
} from './bindings'
import {
  changeActiveBlockCommand,
  deleteActiveBlockCommand,
  deleteSelectedBlockCommand,
  duplicateActiveBlockCommand,
  indentActiveBlockCommand,
  insertBlockAfterActiveCommand,
  moveActiveBlockCommand,
  selectActiveBlockCommand,
  selectAdjacentBlockCommand,
} from './command-transactions'
import type { NanoViewContext } from '../runtime/context'

export interface NanoKeymapActions {
  focusActiveMarkdownSource: () => boolean
  restoreHistory: (direction: 'undo' | 'redo') => void
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
