import type { NanoCommand, NanoCommandsOptions } from './nano-command-types'

export function blockActionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    {
      id: 'duplicate',
      title: 'Duplicate',
      hint: 'Shift Cmd D',
      keywords: ['copy', 'block'],
      run: options.actions.duplicateBlock,
      isEnabled: () => options.activeBlockId !== null,
    },
    {
      id: 'delete',
      title: 'Delete',
      hint: 'Shift Cmd Backspace',
      keywords: ['remove', 'block'],
      run: options.actions.deleteBlock,
      isEnabled: () => options.activeBlockId !== null,
    },
    {
      id: 'move-up',
      title: 'Move Up',
      hint: 'Alt Cmd Up',
      keywords: ['reorder', 'block'],
      run: () => options.actions.moveBlock('up'),
      isEnabled: () => options.canMoveBlock('up'),
    },
    {
      id: 'move-down',
      title: 'Move Down',
      hint: 'Alt Cmd Down',
      keywords: ['reorder', 'block'],
      run: () => options.actions.moveBlock('down'),
      isEnabled: () => options.canMoveBlock('down'),
    },
    {
      id: 'indent',
      title: 'Indent',
      hint: 'Tab',
      keywords: ['nest', 'list'],
      run: () => options.actions.indentBlock('in'),
      isEnabled: () => options.canIndentBlock('in'),
    },
    {
      id: 'outdent',
      title: 'Outdent',
      hint: 'Shift Tab',
      keywords: ['unnest', 'list'],
      run: () => options.actions.indentBlock('out'),
      isEnabled: () => options.canIndentBlock('out'),
    },
  ]
}
