import { blockOptions, type BlockTemplate } from '../blocks/nano-block-options'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './nano-command-types'

type CommandBlockOption = (typeof blockOptions)[number] & { template: BlockTemplate }

export function blockCommands(options: NanoCommandsOptions): NanoCommand[] {
  const targetBlockId = options.blockId ?? options.activeBlockId
  return blockOptions.filter((option): option is CommandBlockOption => option.template !== undefined).map((option): NanoCommand => ({
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
