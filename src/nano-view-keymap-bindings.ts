import type { Command } from 'prosemirror-state'
import {
  blockKeyBindingEntries,
  type BlockTemplate,
} from './nano-block-options'
import { markCommand, markKeyBindingEntries } from './nano-mark-options'

interface BlockKeymapCommands {
  changeActiveBlockCommand: (template: BlockTemplate) => Command
  insertBlockAfterActiveCommand: (template: BlockTemplate) => Command
}

export function markKeymapCommands(): Record<string, Command> {
  return Object.fromEntries(markKeyBindingEntries().map(({ option, keyBinding }) => [
    keyBinding,
    markCommand(option),
  ]))
}

export function blockKeymapCommands(commands: BlockKeymapCommands): Record<string, Command> {
  return Object.fromEntries(blockKeyBindingEntries().flatMap(({ option, keyBinding }) => {
    if (!option.template) return []

    return [[
      keyBinding.key,
      keyBinding.action === 'insertAfterActive'
        ? commands.insertBlockAfterActiveCommand(option.template)
        : commands.changeActiveBlockCommand(option.template),
    ]]
  }))
}
