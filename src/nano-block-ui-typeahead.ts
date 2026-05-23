import type { MoveDirection } from './nano-command-surface'
import { blockOptions, type BlockOption } from './nano-block-options'

export function blockInsertPickerDirection(key: string): MoveDirection | null {
  if (key === 'ArrowLeft' || key === 'ArrowUp') return 'up'
  if (key === 'ArrowRight' || key === 'ArrowDown') return 'down'
  return null
}

export function blockInsertPickerTypeaheadKey(event: KeyboardEvent): string | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  return event.key.length === 1 && event.key !== ' ' ? event.key.toLowerCase() : null
}

export function blockOptionIdForTypeahead(query: string): string | null {
  if (!query.trim()) return null
  return blockOptionsForTypeahead(query)[0]?.id ?? null
}

export function blockOptionsForTypeahead(query: string): BlockOption[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...blockOptions]

  const exactMatches = blockOptions.filter((option) =>
    blockOptionSearchTokens(option).some((token) => token === normalized),
  )
  if (exactMatches.length > 0) return exactMatches

  return blockOptions.filter((option) =>
    blockOptionSearchTokens(option).some((token) => token.startsWith(normalized)),
  )
}

export function blockOptionSearchTokens(option: BlockOption): string[] {
  return [
    option.markdownTrigger ?? '',
    option.id,
    option.title,
    option.label,
  ].map((token) => token.toLowerCase()).filter(Boolean)
}
