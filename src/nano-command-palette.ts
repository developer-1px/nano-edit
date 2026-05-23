import type { NanoCommand } from './nano-command-registry'
import type { CommandPaletteMode, NanoCommandContext } from './nano-command-surface'
import { commandButton, commandEmptyElement } from './nano-command-elements'
import { commandOptionId, createCommandPaletteElements, positionCommandPalette } from './nano-command-palette-dom'
import { handleCommandPaletteKeydown } from './nano-command-palette-keyboard'
import {
  movedPaletteSelectionIndex,
  nearestEnabledCommandIndex,
  visiblePaletteCommands,
} from './nano-command-palette-selection'
import type {
  NanoCommandPalette,
  NanoCommandPaletteOptions,
} from './nano-command-palette-types'
import { createGlobalCommandPaletteShortcut } from './nano-command-palette-global'

export function createNanoCommandPalette(options: NanoCommandPaletteOptions): NanoCommandPalette {
  let paletteMode: CommandPaletteMode | null = null
  let paletteBlockId: string | null = null
  let paletteSelectedIndex = 0
  let destroyed = false
  let focusFrameId: number | null = null

  const { commandInput, commandList, commandPalette } = createCommandPaletteElements()

  const cancelPendingFocus = (): void => {
    if (focusFrameId === null) return
    cancelAnimationFrame(focusFrameId)
    focusFrameId = null
  }

  const closeCommandPalette = (restoreFocus = true): void => {
    if (!paletteMode) return
    cancelPendingFocus()
    paletteMode = null
    paletteBlockId = null
    paletteSelectedIndex = 0
    commandPalette.hidden = true
    commandInput.setAttribute('aria-expanded', 'false')
    commandInput.removeAttribute('aria-activedescendant')
    commandInput.value = ''
    commandList.replaceChildren()
    if (restoreFocus) options.onCommandClose()
  }

  const commandContext = (): NanoCommandContext | null => paletteMode
    ? { mode: paletteMode, blockId: paletteBlockId }
    : null

  const visibleCommands = (): NanoCommand[] => visiblePaletteCommands(
    options.commands,
    commandContext(),
    commandInput.value,
  )

  const runCommand = (command: NanoCommand): void => {
    if (command.isEnabled?.() === false) return
    closeCommandPalette(false)
    command.run()
  }

  const renderCommandPalette = (): void => {
    const commands = visibleCommands()
    paletteSelectedIndex = nearestEnabledCommandIndex(commands, paletteSelectedIndex)
    const activeOptionId = commands.length > 0
      ? commandOptionId(commandList.id, paletteSelectedIndex)
      : null
    if (activeOptionId) commandInput.setAttribute('aria-activedescendant', activeOptionId)
    else commandInput.removeAttribute('aria-activedescendant')
    commandList.replaceChildren(
      ...(commands.length > 0
        ? commands.map((command, index) => commandButton(
          command,
          index,
          paletteSelectedIndex,
          commandOptionId(commandList.id, index),
          runCommand,
          () => {
            paletteSelectedIndex = index
            renderCommandPalette()
          },
        ))
        : [commandEmptyElement()]),
    )
  }

  const openCommandPalette = (mode: CommandPaletteMode, blockId: string | null = null): void => {
    if (destroyed) return
    cancelPendingFocus()
    paletteMode = mode
    paletteBlockId = blockId
    paletteSelectedIndex = 0
    commandInput.value = ''
    commandInput.placeholder = mode === 'slash' ? '' : 'Command'
    commandPalette.dataset.mode = mode
    commandPalette.hidden = false
    commandInput.setAttribute('aria-expanded', 'true')
    positionCommandPalette(commandPalette, paletteMode, options.commandAnchorRect)
    renderCommandPalette()
    focusFrameId = requestAnimationFrame(() => {
      focusFrameId = null
      if (!destroyed && paletteMode) commandInput.focus()
    })
  }

  const movePaletteSelection = (delta: number): void => {
    const commands = visibleCommands()
    if (commands.length === 0) return
    paletteSelectedIndex = movedPaletteSelectionIndex(commands, paletteSelectedIndex, delta)
    renderCommandPalette()
  }

  const handleCommandKeydown = (event: KeyboardEvent): void => {
    handleCommandPaletteKeydown(event, paletteMode, {
      close: () => closeCommandPalette(),
      command: () => visibleCommands()[paletteSelectedIndex] ?? null,
      move: movePaletteSelection,
      run: runCommand,
    })
  }

  const handleGlobalShortcut = createGlobalCommandPaletteShortcut(() => openCommandPalette('global'))

  const handleOutsideClick = (event: MouseEvent): void => {
    if (!paletteMode) return
    if (event.target instanceof Node && commandPalette.contains(event.target)) return
    closeCommandPalette(false)
  }

  const handleCommandInput = (): void => {
    paletteSelectedIndex = 0
    renderCommandPalette()
  }

  commandInput.addEventListener('input', handleCommandInput)
  commandInput.addEventListener('keydown', handleCommandKeydown)
  document.addEventListener('keydown', handleGlobalShortcut, true)
  document.addEventListener('click', handleOutsideClick)

  return {
    commandPalette,
    openCommandPalette,
    destroy: () => {
      if (destroyed) return
      destroyed = true
      cancelPendingFocus()
      closeCommandPalette(false)
      commandInput.removeEventListener('input', handleCommandInput)
      commandInput.removeEventListener('keydown', handleCommandKeydown)
      document.removeEventListener('keydown', handleGlobalShortcut, true)
      document.removeEventListener('click', handleOutsideClick)
    },
  }
}
