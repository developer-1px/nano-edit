import type { AutocompleteOption } from './types'

export function visibleAutocompleteOptions<TOption extends AutocompleteOption>(
  options: readonly TOption[],
  query: string,
): TOption[] {
  const terms = autocompleteQueryTerms(query)
  return options
    .map((option, index) => ({ index, option, rank: autocompleteOptionRank(option, terms) }))
    .filter((candidate) => Number.isFinite(candidate.rank))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((candidate) => candidate.option)
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
  const terms = autocompleteQueryTerms(query)
  if (terms.length === 0) return true

  const searchable = searchableAutocompleteText(option).join(' ').toLowerCase()
  return terms.every((term) => searchable.includes(term))
}

function autocompleteOptionRank(option: AutocompleteOption, terms: readonly string[]): number {
  if (terms.length === 0) return 0

  const fields = searchableAutocompleteText(option).map((field) => field.toLowerCase())
  if (!terms.every((term) => fields.some((field) => field.includes(term)))) return Infinity

  return terms.reduce((rank, term) => rank + bestAutocompleteFieldRank(fields, term), 0)
}

function bestAutocompleteFieldRank(fields: readonly string[], term: string): number {
  return Math.min(...fields.map((field) => autocompleteFieldRank(field, term)))
}

function autocompleteFieldRank(field: string, term: string): number {
  if (field === term) return 0
  if (field.startsWith(term)) return 1
  if (field.split(/\s+/).some((word) => word.startsWith(term))) return 2
  if (field.includes(term)) return 3
  return 100
}

function autocompleteQueryTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function searchableAutocompleteText(option: AutocompleteOption): string[] {
  return [
    option.title,
    option.hint ?? '',
    ...(option.keywords ?? []),
  ]
}
