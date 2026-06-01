import type { NanoCommand, NanoCommandsOptions } from './types'

export function documentActionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [{
    id: 'copy-markdown',
    title: 'Copy',
    hint: 'Clipboard',
    keywords: ['copy', 'markdown', 'md'],
    run: options.actions.copyMarkdown,
    isVisible: () => options.mode === 'global',
  }]
}
