// Mini "universal mention/command layer" composer assembled purely from the
// reusable parts: inline-edit (contenteditable lifecycle), autocomplete
// (headless option surface), and inline-autocomplete (trigger/query/range).
// Demonstrates three de-facto triggers in one editor:
//   @  mention   — token query (no spaces)
//   /  command   — token query (no spaces)
//   [[ wiki link — search query (spaces allowed), paired ]] suffix
import {
  collapseInlineEditSelection,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  restoreInlineEditFocus,
} from '../inline-edit/index'
import {
  createAutocompleteSurface,
  visibleAutocompleteOptions,
  type AutocompleteOption,
} from '../autocomplete/index'
import {
  inlineAutocompleteMatchFromText,
  replaceInlineAutocompleteText,
  type InlineAutocompleteInsertOptions,
  type InlineAutocompleteMatch,
  type InlineAutocompleteTrigger,
} from '../inline-autocomplete/index'

export interface MentionComposerDemoHandle {
  destroy: () => void
}

type ComposerMode = 'mention' | 'command' | 'wikilink'

type ComposerContext = InlineAutocompleteMatch<ComposerMode>

interface ComposerOption extends AutocompleteOption {
  insertText: string
  insertOptions?: InlineAutocompleteInsertOptions
}

const initialText = 'Ping @Mina about /deploy for [[Release Plan Q3]]'

const triggers: readonly InlineAutocompleteTrigger<ComposerMode>[] = [
  { mode: 'mention', trigger: '@' },
  { mode: 'command', trigger: '/' },
  { mode: 'wikilink', trigger: '[[', allowSpaces: true },
]

const mentionOptions: readonly ComposerOption[] = [
  { id: 'm-mina', title: 'Mina', hint: '@Mina', insertText: '@Mina', keywords: ['reviewer'] },
  { id: 'm-jules', title: 'Jules', hint: '@Jules', insertText: '@Jules', keywords: ['design'] },
]

const commandOptions: readonly ComposerOption[] = [
  { id: 'c-deploy', title: 'Deploy', hint: '/deploy', insertText: '/deploy', keywords: ['ship'] },
  { id: 'c-summarize', title: 'Summarize', hint: '/summarize', insertText: '/summarize', keywords: ['tldr'] },
]

// Wiki-link titles contain spaces — only reachable because the trigger sets
// allowSpaces. insertText re-includes the "[[" and the paired "]]" comes from
// the suffix, so the match range (which starts at "[[") is replaced cleanly.
const wikilinkOptions: readonly ComposerOption[] = [
  { id: 'w-release', title: 'Release Plan Q3', hint: '[[…]]', insertText: '[[Release Plan Q3', insertOptions: { suffix: ']]' }, keywords: ['roadmap'] },
  { id: 'w-oncall', title: 'On-Call Runbook', hint: '[[…]]', insertText: '[[On-Call Runbook', insertOptions: { suffix: ']]' }, keywords: ['ops'] },
]

function optionsForMode(mode: ComposerMode): readonly ComposerOption[] {
  if (mode === 'mention') return mentionOptions
  if (mode === 'command') return commandOptions
  return wikilinkOptions
}

export function createMentionComposerDemo(mount: HTMLElement): MentionComposerDemoHandle {
  let destroyed = false
  let lastOffset = initialText.length

  const root = document.createElement('div')
  root.className = 'mention-composer-demo'

  const editor = document.createElement('div')
  editor.className = 'mention-composer-demo-editor inline-edit-demo-editor'
  editor.dataset.mentionComposer = 'true'
  editor.contentEditable = 'true'
  editor.spellcheck = false
  editor.textContent = initialText
  editor.setAttribute('role', 'textbox')
  editor.setAttribute('aria-label', 'Mention composer')

  const suggestion = createAutocompleteSurface<ComposerOption, ComposerContext>({
    ariaLabel: 'Composer suggestion',
    classes: {
      empty: 'mention-composer-demo-suggestion-empty inline-edit-demo-suggestion-empty',
      hint: 'mention-composer-demo-suggestion-hint inline-edit-demo-suggestion-hint',
      input: 'mention-composer-demo-suggestion-input inline-edit-demo-suggestion-input',
      list: 'mention-composer-demo-suggestion-list inline-edit-demo-suggestion-list',
      option: 'mention-composer-demo-suggestion-option inline-edit-demo-suggestion-option',
      root: 'mention-composer-demo-suggestion inline-edit-demo-suggestion',
      title: 'mention-composer-demo-suggestion-title inline-edit-demo-suggestion-title',
    },
    emptyText: 'No match',
    options: (context, query) => visibleAutocompleteOptions(optionsForMode(context.context.mode), query),
    placeholder: (match) => match.context.mode,
    run: (option, match) => {
      replaceInlineAutocompleteText(editor, match, option.insertText, option.insertOptions)
    },
  })

  root.append(editor, suggestion.root)
  mount.replaceChildren(root)
  collapseInlineEditSelection(editor, editor.textContent.length)

  const rememberSelection = (): void => {
    lastOffset = inlineEditSelectionOffset(editor) ?? lastOffset
  }

  const handleInput = (): void => {
    rememberSelection()
    const match = inlineAutocompleteMatchFromText(editor.textContent ?? '', lastOffset, triggers)
    if (match) suggestion.open(match, match.query)
    else suggestion.close()
  }

  const handleEditorKeydown = (event: KeyboardEvent): void => {
    if (inlineEditHistoryDirectionFromKeydown(event)) return
    if (event.key === 'Escape' && suggestion.context()) {
      event.preventDefault()
      suggestion.close()
      restoreInlineEditFocus(() => editor, lastOffset)
    }
  }

  const handleSuggestionKeydown = (event: KeyboardEvent): void => {
    if (!suggestion.context()) return
    if (event.key === 'ArrowDown') { event.preventDefault(); suggestion.move(1); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); suggestion.move(-1); return }
    if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); suggestion.runSelected(); return }
    if (event.key === 'Escape') { event.preventDefault(); suggestion.close() }
  }

  const handleDocumentPointerDown = (event: MouseEvent): void => {
    if (event.target instanceof Node && root.contains(event.target)) return
    suggestion.close()
  }

  editor.addEventListener('input', handleInput)
  editor.addEventListener('keydown', handleEditorKeydown)
  editor.addEventListener('keyup', rememberSelection)
  editor.addEventListener('mouseup', rememberSelection)
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
