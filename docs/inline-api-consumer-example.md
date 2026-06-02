# Inline API Consumer Example

This example shows the intended package-consumer assembly path for a small `contenteditable` inline editor. It does not require the full Nano Edit app shell.

## Responsibilities

- `inline-edit`: contenteditable scalar edit lifecycle, single-line DOM editing helpers, DOM Selection offsets, paste normalization, focus restore, and undo/redo intent detection.
- `inline-autocomplete`: trigger, query, and replacement-range matching for inline suggestions.
- `autocomplete`: headless option selection, or the DOM surface when a separate combobox input is acceptable.
- Host app: commit/cancel policy, history snapshots, option data, product-specific command behavior, and native form-control editors.

## Contenteditable With Inline Autocomplete

```ts
import {
  collapseInlineEditSelection,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  isInlineEditLineBreakInput,
  restoreInlineEditFocus,
} from 'nano-edit/inline-edit'
import {
  createAutocomplete,
  visibleAutocompleteOptions,
  type AutocompleteOption,
} from 'nano-edit/autocomplete'
import {
  inlineAutocompleteMatchFromText,
  replaceInlineAutocompleteText,
  type InlineAutocompleteMatch,
  type InlineAutocompleteTrigger,
} from 'nano-edit/inline-autocomplete'

type Mode = 'mention' | 'command'

interface Option extends AutocompleteOption {
  insertText: string
}

const triggers: readonly InlineAutocompleteTrigger<Mode>[] = [
  { mode: 'mention', trigger: '@' },
  { mode: 'command', trigger: '/' },
]

export function mountInlineMessageEditor(options: {
  editor: HTMLElement
  initialText: string
  mentionOptions: readonly Option[]
  commandOptions: readonly Option[]
  onCommit: (text: string) => void
  onCancel: () => void
}) {
  let activeMatch: InlineAutocompleteMatch<Mode> | null = null
  let history = [{ text: options.initialText, offset: options.initialText.length }]
  let historyIndex = 0

  const autocomplete = createAutocomplete<Option, InlineAutocompleteMatch<Mode>>({
    options: (match, query) => visibleAutocompleteOptions(
      match.context.mode === 'mention' ? options.mentionOptions : options.commandOptions,
      query,
    ),
  })

  options.editor.contentEditable = 'true'
  options.editor.textContent = inlineEditSingleLineText(options.initialText)
  collapseInlineEditSelection(options.editor, options.editor.textContent.length)

  const handleInput = () => {
    remember()
    activeMatch = inlineAutocompleteMatchFromText(
      options.editor.textContent ?? '',
      inlineEditSelectionOffset(options.editor) ?? 0,
      triggers,
    )

    if (activeMatch) autocomplete.open(activeMatch, activeMatch.query)
    else autocomplete.close()
  }

  const handleBeforeInput = (event: InputEvent) => {
    const historyDirection = inlineEditHistoryDirectionFromInputType(event.inputType)
    if (historyDirection) {
      event.preventDefault()
      restoreHistory(historyDirection)
      return
    }

    if (isInlineEditLineBreakInput(event.inputType)) {
      event.preventDefault()
    }
  }

  const handlePaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text/plain')
    if (typeof text !== 'string') return

    event.preventDefault()
    insertInlineEditText(options.editor, inlineEditSingleLineText(text))
    remember()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    const historyDirection = inlineEditHistoryDirectionFromKeydown(event)
    if (historyDirection) {
      event.preventDefault()
      restoreHistory(historyDirection)
      return
    }

    if (autocomplete.context()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        autocomplete.move(1)
        renderSuggestions()
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        autocomplete.move(-1)
        renderSuggestions()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const selected = autocomplete.selectedOption()
        if (selected && activeMatch) {
          replaceInlineAutocompleteText(options.editor, activeMatch, selected.insertText)
          autocomplete.close()
          remember()
        }
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        autocomplete.close()
        return
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      options.onCommit(inlineEditSingleLineText(options.editor.textContent ?? ''))
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      options.editor.textContent = options.initialText
      options.onCancel()
    }
  }

  function remember() {
    const text = options.editor.textContent ?? ''
    const offset = inlineEditSelectionOffset(options.editor) ?? text.length
    if (history[historyIndex]?.text === text) return
    history = history.slice(0, historyIndex + 1)
    history.push({ text, offset })
    historyIndex = history.length - 1
  }

  function restoreHistory(direction: 'undo' | 'redo') {
    const nextIndex = direction === 'undo'
      ? Math.max(0, historyIndex - 1)
      : Math.min(history.length - 1, historyIndex + 1)
    if (nextIndex === historyIndex) return

    historyIndex = nextIndex
    const snapshot = history[historyIndex]
    options.editor.textContent = snapshot.text
    restoreInlineEditFocus(() => options.editor, snapshot.offset)
  }

  function renderSuggestions() {
    const state = autocomplete.state()
    // Render a host-owned listbox from state.visibleOptions and state.selectedIndex.
    // Anchor it near options.editor or a Range created from activeMatch.replaceFrom.
  }

  options.editor.addEventListener('beforeinput', handleBeforeInput)
  options.editor.addEventListener('input', handleInput)
  options.editor.addEventListener('keydown', handleKeydown)
  options.editor.addEventListener('paste', handlePaste)

  return {
    destroy() {
      options.editor.removeEventListener('beforeinput', handleBeforeInput)
      options.editor.removeEventListener('input', handleInput)
      options.editor.removeEventListener('keydown', handleKeydown)
      options.editor.removeEventListener('paste', handlePaste)
    },
  }
}
```

## Notes

- Use `createAutocomplete` when the host already has a `contenteditable` element and wants to render its own anchored list.
- Use `createAutocompleteSurface` when a separate native combobox input is acceptable for the suggestion UI; use `state()` and `selectedOption()` when the host needs to inspect the current surface selection.
- `position(root, context)` on `createAutocompleteSurface` is imperative: mutate `root.style` or `root.dataset` using the supplied context.
- `inline-edit` owns the reusable contenteditable edit lifecycle and detects undo/redo intent, but it does not own durable product history. Store host snapshots when the host needs deterministic undo behavior.
- For paired triggers like `{{`, pass the inner text to `replaceInlineAutocompleteText` and use `suffix: '}}'`.
- Native `input`, `textarea`, and `select` edit lifecycles are outside Nano core. Use this example for contenteditable local edits.
