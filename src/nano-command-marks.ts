import { markCommandOptions } from './nano-mark-options'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './nano-command-types'

export function markCommands(options: NanoCommandsOptions): NanoCommand[] {
  return markCommandOptions().map((option): NanoCommand => ({
    id: `mark:${option.id}`,
    title: option.command.title,
    hint: option.command.label,
    keywords: ['format', option.id],
    run: () => options.actions.runMark(option),
    isVisible: () => options.mode === 'global' || options.hasTextSelection,
  }))
}
