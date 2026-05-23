import { blockOptions } from './nano-block-options'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './nano-command-types'

export function blockCommands(options: NanoCommandsOptions): NanoCommand[] {
  const targetBlockId = options.blockId ?? options.activeBlockId
  return blockOptions.map((option): NanoCommand => ({
    id: `block:${option.id}`,
    title: option.title,
    hint: option.label,
    keywords: ['block', option.id, option.label, option.markdownTrigger ?? ''],
    run: () => {
      if (options.mode === 'slash' && targetBlockId) {
        options.actions.changeBlockById(targetBlockId, option.template)
        return
      }
      options.actions.insertBlock(option.template)
    },
    isEnabled: () => targetBlockId !== null,
  }))
}
