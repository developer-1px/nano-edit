import type {
  CommandPaletteMode,
  InspectorTab,
  NanoCommand,
  NanoCommandContext,
} from '../../commands/types'
import { createNanoCommandPalette } from './command-palette'
import { createNanoInspectorShell, type InspectorMode } from './inspector-shell'

export interface NanoShell {
  inspectorElement: HTMLElement
  inspectorTrigger: HTMLButtonElement
  commandPalette: HTMLElement
  indexOutput: HTMLElement
  markdownOutput: HTMLElement
  openCommandPalette: (mode: CommandPaletteMode, blockId?: string | null) => void
  showInspector: (tab?: InspectorTab) => void
  setInspectorMode: (mode: InspectorMode) => void
  setInspectorTab: (tab: InspectorTab) => void
  syncInspectorChrome: () => void
  destroy: () => void
}

interface NanoShellOptions {
  commandAnchorRect: () => DOMRect | null
  commands: (context: NanoCommandContext) => readonly NanoCommand[]
  inspector?: 'disabled' | 'enabled'
  onCommandClose: () => void
  onIndexSearch: (query: string) => void
  root: HTMLElement
}

export function createNanoShell(options: NanoShellOptions): NanoShell {
  const inspector = createNanoInspectorShell({
    disabled: options.inspector === 'disabled',
    onIndexSearch: options.onIndexSearch,
    root: options.root,
  })
  const palette = createNanoCommandPalette({
    commandAnchorRect: options.commandAnchorRect,
    commands: options.commands,
    onCommandClose: options.onCommandClose,
  })

  return {
    ...inspector,
    commandPalette: palette.commandPalette,
    openCommandPalette: palette.openCommandPalette,
    destroy: () => {
      inspector.destroy()
      palette.destroy()
    },
  }
}
