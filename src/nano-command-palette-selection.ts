import type { NanoCommand } from './nano-command-registry'
import type { NanoCommandContext } from './nano-command-surface'
import { commandMatches } from './nano-command-elements'

export function visiblePaletteCommands(
  commandProvider: (context: NanoCommandContext) => readonly NanoCommand[],
  context: NanoCommandContext | null,
  query: string,
): NanoCommand[] {
  if (!context) return []
  return commandProvider(context)
    .filter((command) => command.isVisible?.() ?? true)
    .filter((command) => commandMatches(command, query))
}

export function nearestEnabledCommandIndex(commands: readonly NanoCommand[], index: number): number {
  if (commands.length === 0) return 0

  const selectedIndex = Math.max(0, Math.min(index, commands.length - 1))
  if (commands[selectedIndex]?.isEnabled?.() !== false) return selectedIndex

  const enabledIndex = commands.findIndex((command) => command.isEnabled?.() !== false)
  return enabledIndex >= 0 ? enabledIndex : 0
}

export function movedPaletteSelectionIndex(
  commands: readonly NanoCommand[],
  index: number,
  delta: number,
): number {
  if (commands.length === 0) return index

  let nextIndex = index
  for (let step = 0; step < commands.length; step += 1) {
    nextIndex = (nextIndex + delta + commands.length) % commands.length
    if (commands[nextIndex]?.isEnabled?.() !== false) break
  }
  return nextIndex
}
