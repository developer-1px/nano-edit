import {
  collapseInlineEditSelection,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  isInlineEditLineBreakInput,
  restoreInlineEditFocus,
} from '../inline-edit/index'
import {
  createAutocompleteSurface,
  visibleAutocompleteOptions,
  type AutocompleteOption,
} from '../autocomplete/index'
import {
  inlineAutocompleteContextFromMode,
  inlineAutocompleteMatchFromText,
  replaceInlineAutocompleteText,
  type InlineAutocompleteMatch,
  type InlineAutocompleteTrigger,
} from '../inline-autocomplete/index'

export interface InlineEditDemoHandle {
  destroy: () => void
}

type InlineEditDemoMode = 'mention' | 'slash'

type InlineEditDemoContext = InlineAutocompleteMatch<InlineEditDemoMode>

interface InlineEditDemoOption extends AutocompleteOption {
  insertText: string
}

const initialInlineEditText = 'Draft release note with @Mina and /summary'

const mentionOptions: readonly InlineEditDemoOption[] = [
  { id: 'mention-mina', title: 'Mina', hint: '@Mina', insertText: '@Mina', keywords: ['owner reviewer'] },
  { id: 'mention-jules', title: 'Jules', hint: '@Jules', insertText: '@Jules', keywords: ['design'] },
  { id: 'mention-ops', title: 'Ops', hint: '@Ops', insertText: '@Ops', keywords: ['team deploy'] },
]

const slashOptions: readonly InlineEditDemoOption[] = [
  { id: 'slash-summary', title: 'Summary', hint: '/summary', insertText: '/summary', keywords: ['short'] },
  { id: 'slash-checklist', title: 'Checklist', hint: '/checklist', insertText: '/checklist', keywords: ['todo task'] },
  { id: 'slash-note', title: 'Note', hint: '/note', insertText: '/note', keywords: ['memo'] },
]

const inlineAutocompleteTriggers: readonly InlineAutocompleteTrigger<InlineEditDemoMode>[] = [
  { mode: 'mention', trigger: '@' },
  { mode: 'slash', trigger: '/' },
]

export function createInlineEditDemo(mount: HTMLElement): InlineEditDemoHandle {
  let destroyed = false
  let lastOffset = initialInlineEditText.length
  let history = [initialInlineEditText]
  let historyIndex = 0

  const root = document.createElement('div')
  root.className = 'inline-edit-demo'

  const surface = document.createElement('section')
  surface.className = 'inline-edit-demo-surface'
  surface.setAttribute('aria-label', 'Inline edit demo')

  const controls = document.createElement('div')
  controls.className = 'inline-edit-demo-controls'

  const mentionButton = inlineEditDemoButton('@', 'Mention')
  const slashButton = inlineEditDemoButton('/', 'Slash command')
  const resetButton = inlineEditDemoButton('Reset', 'Reset')

  const editor = document.createElement('div')
  editor.className = 'inline-edit-demo-editor'
  editor.dataset.inlineEditEditor = 'true'
  editor.contentEditable = 'true'
  editor.spellcheck = false
  editor.textContent = initialInlineEditText
  editor.setAttribute('role', 'textbox')
  editor.setAttribute('aria-label', 'Inline edit')
  editor.setAttribute('aria-multiline', 'false')

  const suggestion = createAutocompleteSurface<InlineEditDemoOption, InlineEditDemoContext>({
    ariaLabel: 'Inline suggestion',
    classes: {
      empty: 'inline-edit-demo-suggestion-empty',
      hint: 'inline-edit-demo-suggestion-hint',
      input: 'inline-edit-demo-suggestion-input',
      list: 'inline-edit-demo-suggestion-list',
      option: 'inline-edit-demo-suggestion-option',
      root: 'inline-edit-demo-suggestion',
      title: 'inline-edit-demo-suggestion-title',
    },
    emptyText: 'No match',
    options: (context, query) => visibleAutocompleteOptions(
      context.context.mode === 'mention' ? mentionOptions : slashOptions,
      query,
    ),
    placeholder: (match) => match.context.mode === 'mention' ? 'Mention' : 'Command',
    run: (option, match) => {
      replaceInlineAutocompleteText(editor, match, option.insertText)
      commitHistory()
    },
  })

  controls.append(mentionButton, slashButton, resetButton)
  surface.append(controls, editor, suggestion.root)
  root.append(surface)
  mount.replaceChildren(root)
  collapseInlineEditSelection(editor, editor.textContent.length)

  const rememberSelection = (): void => {
    lastOffset = inlineEditSelectionOffset(editor) ?? lastOffset
  }

  const openSuggestion = (mode: InlineEditDemoMode): void => {
    rememberSelection()
    const context = inlineAutocompleteContextFromMode(mode, lastOffset, inlineAutocompleteTriggers)
    if (context) {
      suggestion.open({
        context,
        query: '',
        replaceFrom: lastOffset,
        replaceTo: lastOffset,
      })
    }
  }

  const handleBeforeInput = (event: InputEvent): void => {
    const historyDirection = inlineEditHistoryDirectionFromInputType(event.inputType)
    if (historyDirection) {
      event.preventDefault()
      restoreHistory(historyDirection)
      return
    }

    if (isInlineEditLineBreakInput(event.inputType)) {
      event.preventDefault()
      return
    }

    if (typeof event.data === 'string' && event.data.length > 0 && event.data !== inlineEditSingleLineText(event.data)) {
      event.preventDefault()
      insertInlineEditText(editor, inlineEditSingleLineText(event.data))
      commitHistory()
    }
  }

  const handleInput = (): void => {
    rememberSelection()
    commitHistory()

    const match = inlineAutocompleteMatchFromText(
      editor.textContent ?? '',
      lastOffset,
      inlineAutocompleteTriggers,
    )
    if (match) suggestion.open(match, match.query)
    else suggestion.close()
  }

  const handleEditorKeydown = (event: KeyboardEvent): void => {
    const historyDirection = inlineEditHistoryDirectionFromKeydown(event)
    if (historyDirection) {
      event.preventDefault()
      restoreHistory(historyDirection)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      return
    }

    if (event.key === 'Escape' && suggestion.context()) {
      event.preventDefault()
      closeSuggestion()
    }
  }

  const handleSuggestionKeydown = (event: KeyboardEvent): void => {
    if (!suggestion.context()) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      suggestion.move(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      suggestion.move(-1)
      return
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      suggestion.runSelected()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeSuggestion()
    }
  }

  const handlePaste = (event: ClipboardEvent): void => {
    const text = event.clipboardData?.getData('text/plain')
    if (typeof text !== 'string') return

    event.preventDefault()
    insertInlineEditText(editor, inlineEditSingleLineText(text))
    commitHistory()
  }

  const handleDocumentPointerDown = (event: MouseEvent): void => {
    if (!(event.target instanceof Node)) return
    if (root.contains(event.target)) return
    suggestion.close()
  }

  const resetEditor = (): void => {
    editor.textContent = initialInlineEditText
    history = [initialInlineEditText]
    historyIndex = 0
    lastOffset = initialInlineEditText.length
    suggestion.close()
    restoreInlineEditFocus(() => editor, lastOffset)
  }

  function commitHistory(): void {
    const text = editor.textContent ?? ''
    if (history[historyIndex] === text) return

    history = history.slice(0, historyIndex + 1)
    history.push(text)
    historyIndex = history.length - 1
    lastOffset = inlineEditSelectionOffset(editor) ?? text.length
  }

  function restoreHistory(direction: 'undo' | 'redo'): void {
    const nextIndex = direction === 'undo'
      ? Math.max(0, historyIndex - 1)
      : Math.min(history.length - 1, historyIndex + 1)

    if (nextIndex === historyIndex) return

    historyIndex = nextIndex
    const text = history[historyIndex] ?? ''
    editor.textContent = text
    lastOffset = Math.min(lastOffset, text.length)
    restoreInlineEditFocus(() => editor, lastOffset)
  }

  function closeSuggestion(): void {
    suggestion.close()
    restoreInlineEditFocus(() => editor, lastOffset)
  }

  mentionButton.addEventListener('mousedown', preventDefault)
  slashButton.addEventListener('mousedown', preventDefault)
  resetButton.addEventListener('mousedown', preventDefault)
  mentionButton.addEventListener('click', () => openSuggestion('mention'))
  slashButton.addEventListener('click', () => openSuggestion('slash'))
  resetButton.addEventListener('click', resetEditor)
  editor.addEventListener('beforeinput', handleBeforeInput)
  editor.addEventListener('input', handleInput)
  editor.addEventListener('keydown', handleEditorKeydown)
  editor.addEventListener('keyup', rememberSelection)
  editor.addEventListener('mouseup', rememberSelection)
  editor.addEventListener('paste', handlePaste)
  suggestion.input.addEventListener('keydown', handleSuggestionKeydown)
  document.addEventListener('mousedown', handleDocumentPointerDown)

  return {
    destroy: () => {
      if (destroyed) return
      destroyed = true
      suggestion.destroy()
      document.removeEventListener('mousedown', handleDocumentPointerDown)
      mount.replaceChildren()
    },
  }
}

function inlineEditDemoButton(text: string, label: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.className = 'inline-edit-demo-button'
  button.type = 'button'
  button.textContent = text
  button.ariaLabel = label
  button.dataset.inlineEditTrigger = label.toLowerCase().replace(/\s+/g, '-')
  return button
}

function preventDefault(event: Event): void {
  event.preventDefault()
}
