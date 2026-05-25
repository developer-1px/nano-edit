import type { NanoCommand } from '../commands/nano-command-registry'
import type {
  CommandPaletteMode,
  NanoCommandContext,
} from './nano-command-surface'

export interface NanoCommandPaletteOptions {
  commandAnchorRect: () => DOMRect | null
  commands: (context: NanoCommandContext) => readonly NanoCommand[]
  onCommandClose: () => void
}

export interface NanoCommandPalette {
  commandPalette: HTMLElement
  openCommandPalette: (mode: CommandPaletteMode, blockId?: string | null) => void
  destroy: () => void
}
