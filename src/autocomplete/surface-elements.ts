import type {
  AutocompleteOption,
  AutocompleteSurfaceClasses,
  AutocompleteSurfaceElements,
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

export function autocompleteOptionId(listId: string, index: number): string {
  return `${listId}-option-${index}`
}

export function autocompleteSurfaceClasses(
  classes: Partial<AutocompleteSurfaceClasses> | undefined,
): AutocompleteSurfaceClasses {
  return {
    ...defaultAutocompleteClasses,
    ...classes,
  }
}

export function createAutocompleteSurfaceElements(
  classes: AutocompleteSurfaceClasses,
  ariaLabel = 'Autocomplete',
): AutocompleteSurfaceElements {
  autocompleteSurfaceId += 1
  const listId = `nano-autocomplete-list-${autocompleteSurfaceId}`
  const root = document.createElement('div')
  root.className = classes.root
  root.hidden = true

  const input = document.createElement('input')
  input.className = classes.input
  input.type = 'search'
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

export function autocompleteOptionElement<TOption extends AutocompleteOption>(
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

export function autocompleteEmptyElement(classes: AutocompleteSurfaceClasses, text: string): HTMLElement {
  const empty = document.createElement('p')
  empty.className = classes.empty
  empty.textContent = text
  return empty
}
