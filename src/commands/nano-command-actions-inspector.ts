import type { NanoCommand, NanoCommandsOptions } from './nano-command-types'

export function inspectorActionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    {
      id: 'source',
      title: 'Source',
      hint: 'Shift Cmd M',
      keywords: ['markdown', 'source', 'raw'],
      run: options.actions.focusMarkdownSource,
      isEnabled: () => options.activeBlockId !== null,
    },
    {
      id: 'index',
      title: 'Index',
      keywords: ['inspector', 'index', 'links', 'tags'],
      run: () => options.actions.showInspector('index'),
    },
    {
      id: 'markdown',
      title: 'Source',
      hint: 'Panel',
      keywords: ['inspector', 'source', 'md'],
      run: () => options.actions.showInspector('markdown'),
    },
    {
      id: 'pin-inspector',
      title: 'Pin',
      hint: 'Panel',
      keywords: ['dock', 'panel'],
      run: options.actions.togglePinnedInspector,
      isVisible: () => options.mode === 'global',
    },
  ]
}
