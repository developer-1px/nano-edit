import type { NanoCommand } from '../commands/nano-command-registry'
import type { CommandPaletteMode } from './nano-command-surface'

export function handleCommandPaletteKeydown(
  event: KeyboardEvent,
  paletteMode: CommandPaletteMode | null,
  actions: {
    close: () => void
    command: () => NanoCommand | null
    move: (delta: number) => void
    run: (command: NanoCommand) => void
  },
): void {
  if (!paletteMode) return
  if (event.key === 'Escape') {
    event.preventDefault()
    actions.close()
    return
  }
  if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
    event.preventDefault()
    actions.move(1)
    return
  }
  if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
    event.preventDefault()
    actions.move(-1)
    return
  }
  if (event.key !== 'Enter') return
  event.preventDefault()
  const command = actions.command()
  if (command) actions.run(command)
}
