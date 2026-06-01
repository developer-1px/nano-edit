export {
  createAutocompleteSurface as createSuggestionSurface,
  movedAutocompleteIndex as movedSuggestionIndex,
  nearestEnabledAutocompleteIndex as nearestEnabledSuggestionIndex,
  autocompleteOptionMatches as suggestionOptionMatches,
  visibleAutocompleteOptions as visibleSuggestionOptions,
} from '../autocomplete/index'
export type {
  AutocompleteSurface as SuggestionSurface,
  AutocompleteSurfaceClasses as SuggestionSurfaceClasses,
  AutocompleteSurfaceElements as SuggestionSurfaceElements,
  AutocompleteOption as SuggestionSurfaceOption,
  AutocompleteSurfaceOptions as SuggestionSurfaceOptions,
} from '../autocomplete/index'
