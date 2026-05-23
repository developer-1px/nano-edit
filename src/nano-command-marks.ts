import { markToolbarOptions } from './nano-mark-options'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './nano-command-types'

export function markCommands(options: NanoCommandsOptions): NanoCommand[] {
  return markToolbarOptions().map((option): NanoCommand => ({
    id: `mark:${option.id}`,
    title: option.toolbar.title,
    hint: option.toolbar.label,
    keywords: ['format', option.id],
    run: () => options.actions.runMark(option),
    isVisible: () => options.mode === 'global' || options.hasTextSelection,
  }))
}
