import type { NanoCommand } from './nano-command-registry'
import { createNanoCommandPalette } from './nano-command-palette'
import { createNanoInspectorShell } from './nano-inspector-shell'

export type IndentDirection = 'in' | 'out'
export type MoveDirection = 'down' | 'up'
export type InspectorMode = 'floating' | 'hidden' | 'pinned'
export type InspectorTab = 'index' | 'markdown'
export type CommandPaletteMode = 'global' | 'slash'

export interface NanoCommandContext {
  blockId: string | null
  mode: CommandPaletteMode
}

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

export interface NanoShellOptions {
  commandAnchorRect: () => DOMRect | null
  commands: (context: NanoCommandContext) => readonly NanoCommand[]
  onCommandClose: () => void
  onIndexSearch: (query: string) => void
  root: HTMLElement
}

export function createNanoShell(options: NanoShellOptions): NanoShell {
  const inspector = createNanoInspectorShell({
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
