import type { NanoCommand } from '../../commands/registry'
import type {
  CommandPaletteMode,
  NanoCommandContext,
} from './shell'

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
