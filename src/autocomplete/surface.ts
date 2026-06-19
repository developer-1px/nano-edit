import { createAutocomplete } from './core'
import type {
  AutocompleteOption,
  AutocompleteSurface,
  AutocompleteSurfaceClasses,
  AutocompleteSurfaceElements,
  AutocompleteSurfaceOptions,
} from './types'

const defaultAutocompleteClasses: AutocompleteSurfaceClasses = {
  empty: 'nano-autocomplete-empty',
  hint: 'nano-autocomplete-hint',
  input: 'nano-autocomplete-input',
  list: 'nano-autocomplete-list',
  option: 'nano-autocomplete-option',
  root: 'nano-autocomplete-surface',
  title: 'nano-autocomplete-title',
}

let autocompleteSurfaceId = 0

export function createAutocompleteSurface<
  TOption extends AutocompleteOption,
  TContext,
>(options: AutocompleteSurfaceOptions<TOption, TContext>): AutocompleteSurface<TContext, TOption> {
  let destroyed = false
  let focusFrameId: number | null = null

  const autocomplete = createAutocomplete<TOption, TContext>({
    options: options.options,
  })
  const classes = autocompleteSurfaceClasses(options.classes)
  const { input, list, root } = createAutocompleteSurfaceElements(
    classes,
    options.ariaLabel,
    options.inputType,
  )
  const emptyText = options.emptyText ?? 'No option'

  const cancelPendingFocus = (): void => {
    if (focusFrameId === null) return
    cancelAnimationFrame(focusFrameId)
    focusFrameId = null
  }

  const render = (): void => {
    const state = autocomplete.state()
    const candidates = state.visibleOptions
    const activeOptionId = candidates.length > 0
      ? autocompleteOptionId(list.id, state.selectedIndex)
      : null

    if (activeOptionId) input.setAttribute('aria-activedescendant', activeOptionId)
    else input.removeAttribute('aria-activedescendant')

    list.replaceChildren(
      ...(candidates.length > 0
        ? candidates.map((option, index) => autocompleteOptionElement(
          option,
          index,
          state.selectedIndex,
          autocompleteOptionId(list.id, index),
          classes,
          runOption,
          () => {
            autocomplete.move(index - autocomplete.state().selectedIndex)
            render()
          },
        ))
        : [autocompleteEmptyElement(classes, emptyText)]),
    )

    if (activeOptionId) {
      list.querySelector<HTMLElement>(`[id="${activeOptionId}"]`)
        ?.scrollIntoView({ block: 'nearest' })
    }
  }

  const close = (): void => {
    if (!autocomplete.context()) return
    cancelPendingFocus()
    autocomplete.close()
    root.hidden = true
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    input.value = ''
    list.replaceChildren()
  }

  const runOption = (option: TOption): void => {
    const currentContext = autocomplete.context()
    if (!currentContext || option.disabled) return
    close()
    options.run(option, currentContext)
  }

  const open = (nextContext: TContext, query = ''): void => {
    if (destroyed) return
    cancelPendingFocus()
    autocomplete.open(nextContext, query)
    input.value = query
    input.placeholder = placeholderForContext(options.placeholder, nextContext)
    root.hidden = false
    input.setAttribute('aria-expanded', 'true')
    options.position?.(root, nextContext)
    render()
    focusFrameId = requestAnimationFrame(() => {
      focusFrameId = null
      if (!destroyed && autocomplete.context()) input.focus()
    })
  }

  const move = (delta: number): void => {
    autocomplete.move(delta)
    render()
  }

  const runSelected = (): void => {
    const option = autocomplete.selectedOption()
    if (option) runOption(option)
  }

  const setQuery = (query: string): void => {
    input.value = query
    autocomplete.setQuery(query)
    render()
  }

  const handleInput = (): void => setQuery(input.value)

  input.addEventListener('input', handleInput)

  return {
    input,
    list,
    root,
    close,
    context: autocomplete.context,
    destroy: () => {
      if (destroyed) return
      destroyed = true
      cancelPendingFocus()
      close()
      input.removeEventListener('input', handleInput)
    },
    move,
    open,
    render,
    runSelected,
    selectedOption: autocomplete.selectedOption,
    setQuery,
    state: autocomplete.state,
  }
}

function placeholderForContext<TContext>(
  placeholder: string | ((context: TContext) => string) | undefined,
  context: TContext,
): string {
  if (typeof placeholder === 'function') return placeholder(context)
  return placeholder ?? ''
}

function autocompleteOptionId(listId: string, index: number): string {
  return `${listId}-option-${index}`
}

function autocompleteSurfaceClasses(
  classes: Partial<AutocompleteSurfaceClasses> | undefined,
): AutocompleteSurfaceClasses {
  return {
    ...defaultAutocompleteClasses,
    ...classes,
  }
}

function createAutocompleteSurfaceElements(
  classes: AutocompleteSurfaceClasses,
  ariaLabel = 'Autocomplete',
  inputType: 'search' | 'text' = 'text',
): AutocompleteSurfaceElements {
  autocompleteSurfaceId += 1
  const listId = `nano-autocomplete-list-${autocompleteSurfaceId}`
  const root = document.createElement('div')
  root.className = classes.root
  root.hidden = true

  const input = document.createElement('input')
  input.className = classes.input
  input.type = inputType
  input.spellcheck = false
  input.autocomplete = 'off'
  input.ariaLabel = ariaLabel
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-controls', listId)
  input.setAttribute('aria-expanded', 'false')

  const list = document.createElement('div')
  list.className = classes.list
  list.id = listId
  list.setAttribute('role', 'listbox')

  root.append(input, list)
  return { input, list, root }
}

function autocompleteOptionElement<TOption extends AutocompleteOption>(
  option: TOption,
  index: number,
  selectedIndex: number,
  optionId: string,
  classes: AutocompleteSurfaceClasses,
  runOption: (option: TOption) => void,
  selectOption: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  const title = document.createElement('span')
  title.className = classes.title
  title.textContent = option.title
  button.type = 'button'
  button.className = classes.option
  button.id = optionId
  button.tabIndex = -1
  button.setAttribute('role', 'option')
  button.disabled = option.disabled === true
  button.dataset.selected = String(index === selectedIndex)
  button.setAttribute('aria-selected', String(index === selectedIndex))
  if (button.disabled) button.setAttribute('aria-disabled', 'true')
  button.append(title)

  if (option.hint) {
    const hint = document.createElement('span')
    hint.className = classes.hint
    hint.textContent = option.hint
    button.append(hint)
  }

  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('mousemove', selectOption)
  button.addEventListener('click', () => runOption(option))
  return button
}

function autocompleteEmptyElement(classes: AutocompleteSurfaceClasses, text: string): HTMLElement {
  const empty = document.createElement('p')
  empty.className = classes.empty
  empty.textContent = text
  return empty
}
