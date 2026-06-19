import { blockCommands } from './blocks'
import { markCommands } from './marks'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './types'

export function nanoCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    ...blockCommands(options),
    ...markCommands(options),
    ...inspectorActionCommands(options),
    ...documentActionCommands(options),
    ...blockActionCommands(options),
    ...historyActionCommands(options),
  ]
}

function inspectorActionCommands(options: NanoCommandsOptions): NanoCommand[] {
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

function documentActionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [{
    id: 'copy-markdown',
    title: 'Copy',
    hint: 'Clipboard',
    keywords: ['copy', 'markdown', 'md'],
    run: options.actions.copyMarkdown,
    isVisible: () => options.mode === 'global',
  }]
}

function blockActionCommands(options: NanoCommandsOptions): NanoCommand[] {
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

function historyActionCommands(options: NanoCommandsOptions): NanoCommand[] {
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
