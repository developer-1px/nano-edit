import type { Command } from 'prosemirror-state'
import {
  blockKeyBindingEntries,
  type BlockKeyBindingEntry,
  type BlockTemplate,
} from '../../blocks/nano-block-options'
import { markCommand, markKeyBindingEntries } from '../../marks/nano-mark-options'

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

export function blockKeymapCommands(
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
