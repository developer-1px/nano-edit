import type { AutocompleteOption } from './types'

export function visibleAutocompleteOptions<TOption extends AutocompleteOption>(
  options: readonly TOption[],
  query: string,
): TOption[] {
  return options.filter((option) => autocompleteOptionMatches(option, query))
}

export function nearestEnabledAutocompleteIndex(
  options: readonly AutocompleteOption[],
  index: number,
): number {
  if (options.length === 0) return 0

  const selectedIndex = Math.max(0, Math.min(index, options.length - 1))
  if (!options[selectedIndex]?.disabled) return selectedIndex

  const enabledIndex = options.findIndex((option) => !option.disabled)
  return enabledIndex >= 0 ? enabledIndex : 0
}

export function movedAutocompleteIndex(
  options: readonly AutocompleteOption[],
  index: number,
  delta: number,
): number {
  if (options.length === 0) return index

  let nextIndex = index
  for (let step = 0; step < options.length; step += 1) {
    nextIndex = (nextIndex + delta + options.length) % options.length
    if (!options[nextIndex]?.disabled) break
  }
  return nextIndex
}

export function autocompleteOptionMatches(option: AutocompleteOption, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true

  const searchable = [
    option.title,
    option.hint ?? '',
    ...(option.keywords ?? []),
  ].join(' ').toLowerCase()
  return terms.every((term) => searchable.includes(term))
}
