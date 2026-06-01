import {
  movedAutocompleteIndex,
  nearestEnabledAutocompleteIndex,
} from './selection'
import type {
  Autocomplete,
  AutocompleteOption,
  AutocompleteOptions,
  AutocompleteState,
} from './types'

export function createAutocomplete<
  TOption extends AutocompleteOption,
  TContext,
>(options: AutocompleteOptions<TOption, TContext>): Autocomplete<TOption, TContext> {
  let activeContext: TContext | null = null
  let query = ''
  let selectedIndex = 0

  const visibleOptions = (): TOption[] => activeContext
    ? [...options.options(activeContext, query)]
    : []

  const normalizeSelectedIndex = (): TOption[] => {
    const candidates = visibleOptions()
    selectedIndex = nearestEnabledAutocompleteIndex(candidates, selectedIndex)
    return candidates
  }

  const state = (): AutocompleteState<TOption, TContext> => {
    const candidates = normalizeSelectedIndex()
    return {
      activeOption: candidates[selectedIndex] ?? null,
      context: activeContext,
      open: activeContext !== null,
      query,
      selectedIndex,
      visibleOptions: candidates,
    }
  }

  return {
    close: () => {
      activeContext = null
      query = ''
      selectedIndex = 0
    },
    context: () => activeContext,
    move: (delta: number) => {
      const candidates = visibleOptions()
      if (candidates.length === 0) return
      selectedIndex = movedAutocompleteIndex(candidates, selectedIndex, delta)
    },
    open: (context: TContext, nextQuery = '') => {
      activeContext = context
      query = nextQuery
      selectedIndex = 0
      normalizeSelectedIndex()
    },
    selectedOption: () => state().activeOption,
    setQuery: (nextQuery: string) => {
      query = nextQuery
      selectedIndex = 0
      normalizeSelectedIndex()
    },
    state,
  }
}
