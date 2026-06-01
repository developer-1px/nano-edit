import type { NanoCommand } from '../../commands/registry'
import {
  createAutocompleteSurface,
  visibleAutocompleteOptions,
  type AutocompleteOption,
} from '../../autocomplete/index'
import type { CommandPaletteMode, NanoCommandContext } from './shell'
import { createNanoCommandInteraction } from './command-interaction'
import { positionCommandPalette } from './command-palette-dom'
import type {
  NanoCommandPalette,
  NanoCommandPaletteOptions,
} from './command-palette-types'

interface CommandAutocompleteOption extends AutocompleteOption {
  command: NanoCommand
}

export function createNanoCommandPalette(options: NanoCommandPaletteOptions): NanoCommandPalette {
  let destroyed = false

  const interaction = createNanoCommandInteraction()
  const surface = createAutocompleteSurface<CommandAutocompleteOption, NanoCommandContext>({
    ariaLabel: 'Command',
    classes: {
      empty: 'nano-command-empty',
      hint: 'nano-command-hint',
      input: 'nano-command-input',
      list: 'nano-command-list',
      option: 'nano-command-option',
      root: 'nano-command-palette',
      title: 'nano-command-title',
    },
    emptyText: 'No command',
    options: (context, query) => visibleAutocompleteOptions(
      options.commands(context)
        .filter((command) => command.isVisible?.() ?? true)
        .map(commandSuggestionOption),
      query,
    ),
    placeholder: (context) => context.mode === 'slash' ? '' : 'Command',
    position: (root, context) => {
      root.dataset.mode = context.mode
      positionCommandPalette(root, context.mode, options.commandAnchorRect)
    },
    run: (option) => {
      interaction.releaseCommandPalette()
      option.command.run()
    },
  })

  const closeCommandPalette = (restoreFocus = true): void => {
    if (!surface.context()) return
    surface.close()
    interaction.releaseCommandPalette()
    if (restoreFocus) options.onCommandClose()
  }

  const openCommandPalette = (mode: CommandPaletteMode, blockId: string | null = null): void => {
    if (destroyed) return
    surface.open({ mode, blockId })
    interaction.activateCommandPalette()
  }

  const handleCommandKeydown = (event: KeyboardEvent): void => {
    if (!surface.context()) return
    interaction.handleCommandPaletteKeydown(event, {
      close: () => closeCommandPalette(),
      move: surface.move,
      runSelected: surface.runSelected,
    })
  }

  const handleGlobalShortcut = (event: KeyboardEvent): void => {
    interaction.handleGlobalKeydown(event, () => openCommandPalette('global'))
  }

  const handleOutsideClick = (event: MouseEvent): void => {
    if (!surface.context()) return
    if (event.target instanceof Node && surface.root.contains(event.target)) return
    closeCommandPalette(false)
  }

  surface.input.addEventListener('keydown', handleCommandKeydown)
  document.addEventListener('keydown', handleGlobalShortcut, true)
  document.addEventListener('click', handleOutsideClick)

  return {
    commandPalette: surface.root,
    openCommandPalette,
    destroy: () => {
      if (destroyed) return
      destroyed = true
      closeCommandPalette(false)
      surface.input.removeEventListener('keydown', handleCommandKeydown)
      document.removeEventListener('keydown', handleGlobalShortcut, true)
      document.removeEventListener('click', handleOutsideClick)
      surface.destroy()
      interaction.destroy()
    },
  }
}

function commandSuggestionOption(command: NanoCommand): CommandAutocompleteOption {
  return {
    command,
    disabled: command.isEnabled?.() === false,
    hint: command.hint,
    id: command.id,
    keywords: command.keywords,
    title: command.title,
  }
}
