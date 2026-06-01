import { createAutocomplete } from './core'
import {
  autocompleteEmptyElement,
  autocompleteOptionElement,
  autocompleteOptionId,
  autocompleteSurfaceClasses,
  createAutocompleteSurfaceElements,
} from './surface-elements'
import type {
  AutocompleteOption,
  AutocompleteSurface,
  AutocompleteSurfaceOptions,
} from './types'

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
  const { input, list, root } = createAutocompleteSurfaceElements(classes, options.ariaLabel)
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
