import type {
  CommandPaletteMode,
  NanoCommand,
  NanoCommandContext,
} from '../../commands/types'
import { createAutocompleteSurface } from '../../autocomplete/surface'
import { visibleAutocompleteOptions } from '../../autocomplete/selection'
import type { AutocompleteOption } from '../../autocomplete/types'
import { clampNumber } from './command-elements'
import { createNanoCommandInteraction } from './command-interaction'

interface CommandAutocompleteOption extends AutocompleteOption {
  command: NanoCommand
}

interface NanoCommandPaletteOptions {
  commandAnchorRect: () => DOMRect | null
  commands: (context: NanoCommandContext) => readonly NanoCommand[]
  onCommandClose: () => void
}

interface NanoCommandPalette {
  commandPalette: HTMLElement
  openCommandPalette: (mode: CommandPaletteMode, blockId?: string | null) => void
  destroy: () => void
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

function positionCommandPalette(
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
