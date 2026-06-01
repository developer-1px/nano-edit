export interface AutocompleteOption {
  disabled?: boolean
  hint?: string
  id: string
  keywords?: readonly string[]
  title: string
}

export type AutocompleteSurfaceOption = AutocompleteOption

export interface AutocompleteOptions<
  TOption extends AutocompleteOption,
  TContext,
> {
  options: (context: TContext, query: string) => readonly TOption[]
}

export interface AutocompleteState<
  TOption extends AutocompleteOption,
  TContext,
> {
  activeOption: TOption | null
  context: TContext | null
  open: boolean
  query: string
  selectedIndex: number
  visibleOptions: readonly TOption[]
}

export interface Autocomplete<
  TOption extends AutocompleteOption,
  TContext,
> {
  close: () => void
  context: () => TContext | null
  move: (delta: number) => void
  open: (context: TContext, query?: string) => void
  selectedOption: () => TOption | null
  setQuery: (query: string) => void
  state: () => AutocompleteState<TOption, TContext>
}

export interface AutocompleteSurfaceClasses {
  empty: string
  hint: string
  input: string
  list: string
  option: string
  root: string
  title: string
}

export interface AutocompleteSurfaceElements {
  input: HTMLInputElement
  list: HTMLElement
  root: HTMLElement
}

export interface AutocompleteSurfaceOptions<
  TOption extends AutocompleteOption,
  TContext,
> extends AutocompleteOptions<TOption, TContext> {
  ariaLabel?: string
  classes?: Partial<AutocompleteSurfaceClasses>
  emptyText?: string
  placeholder?: string | ((context: TContext) => string)
  position?: (root: HTMLElement, context: TContext) => void
  run: (option: TOption, context: TContext) => void
}

export interface AutocompleteSurface<
  TContext,
  TOption extends AutocompleteOption = AutocompleteOption,
> {
  readonly input: HTMLInputElement
  readonly list: HTMLElement
  readonly root: HTMLElement
  close: () => void
  context: () => TContext | null
  destroy: () => void
  move: (delta: number) => void
  open: (context: TContext, query?: string) => void
  render: () => void
  runSelected: () => void
  selectedOption: () => TOption | null
  setQuery: (query: string) => void
  state: () => AutocompleteState<TOption, TContext>
}
