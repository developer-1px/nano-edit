import { clampNumber } from './nano-command-elements'
import type { CommandPaletteMode } from './nano-command-surface'

export interface NanoCommandPaletteElements {
  commandInput: HTMLInputElement
  commandList: HTMLElement
  commandPalette: HTMLElement
}

export function createCommandPaletteElements(): NanoCommandPaletteElements {
  const commandPalette = document.createElement('div')
  commandPalette.className = 'nano-command-palette'
  commandPalette.hidden = true
  const commandInput = document.createElement('input')
  commandInput.className = 'nano-command-input'
  commandInput.type = 'search'
  commandInput.spellcheck = false
  commandInput.autocomplete = 'off'
  commandInput.ariaLabel = 'Command'
  const commandList = document.createElement('div')
  commandList.className = 'nano-command-list'
  commandPalette.append(commandInput, commandList)
  return { commandInput, commandList, commandPalette }
}

export function positionCommandPalette(
  commandPalette: HTMLElement,
  mode: CommandPaletteMode | null,
  commandAnchorRect: () => DOMRect | null,
): void {
  commandPalette.style.removeProperty('--command-left')
  commandPalette.style.removeProperty('--command-top')
  if (mode !== 'slash') return
  const rect = commandAnchorRect()
  if (!rect) return
  const width = Math.min(360, window.innerWidth - 32)
  const left = clampNumber(rect.left, 16, Math.max(16, window.innerWidth - width - 16))
  const top = clampNumber(rect.bottom + 8, 16, Math.max(16, window.innerHeight - 320))
  commandPalette.style.setProperty('--command-left', `${left}px`)
  commandPalette.style.setProperty('--command-top', `${top}px`)
}
