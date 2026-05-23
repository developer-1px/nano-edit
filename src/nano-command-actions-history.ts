import type { NanoCommand, NanoCommandsOptions } from './nano-command-types'

export function historyActionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    {
      id: 'undo',
      title: 'Undo',
      hint: 'Cmd Z',
      keywords: ['history'],
      run: options.actions.undo,
      isVisible: () => options.mode === 'global',
    },
    {
      id: 'redo',
      title: 'Redo',
      hint: 'Shift Cmd Z',
      keywords: ['history'],
      run: options.actions.redo,
      isVisible: () => options.mode === 'global',
    },
  ]
}
