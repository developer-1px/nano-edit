import {
  createNanoDocument,
  createNanoView,
  nanoDocumentFromMarkdown as nanoDocumentFromRootMarkdown,
  type NanoViewHandle,
} from 'nano-edit'
import {
  nanoDocumentFromMarkdown,
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
  type NanoMarkdownBlockEntry,
} from 'nano-edit/markdown'
import {
  nanoDocumentIndex,
  nanoDocumentSearch,
  type NanoDocumentIndex,
  type NanoDocumentSearchResult,
} from 'nano-edit/document-index'
import {
  createEmptyNanoDocument,
  type NanoDocument,
} from 'nano-edit/model'
import {
  createAutocomplete,
  visibleAutocompleteOptions,
  type Autocomplete,
  type AutocompleteOption,
} from 'nano-edit/autocomplete'
import {
  inlineAutocompleteMatchFromText,
  replaceInlineAutocompleteText,
  type InlineAutocompleteMatch,
  type InlineAutocompleteTrigger,
} from 'nano-edit/inline-autocomplete'
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

type InlineMode = 'mention' | 'command'

interface PublicOption extends AutocompleteOption {
  insertText: string
}

interface ContenteditableCellEditHost {
  cell: HTMLElement
  initialText: string
  onCommit: (value: string) => void
  onCancel: () => void
  restoreGridFocus: () => void
}

export function exerciseNanoEditPublicContract(mount: HTMLElement) {
  const rootDocument: NanoDocument = nanoDocumentFromRootMarkdown('# Root entry')
  const view: NanoViewHandle = createNanoView({
    mount,
    engine: createNanoDocument(rootDocument),
  })

  const modelDocument = createEmptyNanoDocument()
  const parsedDocument = nanoDocumentFromMarkdown('# Markdown\n\n- [ ] Task')
  const markdownBlocks: readonly NanoMarkdownBlockEntry[] = nanoMarkdownBlocksFromDocument(parsedDocument)
  const markdownSource: string = nanoMarkdownFromDocument(parsedDocument)

  const index: NanoDocumentIndex = nanoDocumentIndex(parsedDocument)
  const search: NanoDocumentSearchResult | null = nanoDocumentSearch(parsedDocument, '@title Markdown')

  const triggers: readonly InlineAutocompleteTrigger<InlineMode>[] = [
    { mode: 'mention', trigger: '@' },
    { mode: 'command', trigger: '/' },
  ]
  const match: InlineAutocompleteMatch<InlineMode> | null = inlineAutocompleteMatchFromText('@mi', 3, triggers)
  const options: readonly PublicOption[] = [
    { id: 'mina', title: 'Mina', insertText: '@Mina' },
  ]
  const autocomplete: Autocomplete<PublicOption, InlineAutocompleteMatch<InlineMode>> = createAutocomplete({
    options: (_match, query) => visibleAutocompleteOptions(options, query),
  })
  if (match) {
    autocomplete.open(match, match.query)
    replaceInlineAutocompleteText(mount, match, autocomplete.selectedOption()?.insertText ?? '@Mina')
  }

  insertInlineEditText(mount, inlineEditSingleLineText('one\ntwo'))
  restoreInlineEditFocus(() => mount, inlineEditSelectionOffset(mount) ?? 0)

  return {
    autocomplete,
    index,
    markdownBlocks,
    markdownSource,
    modelDocument,
    search,
    view,
  }
}

export function exerciseContenteditableCellEditContract(host: ContenteditableCellEditHost) {
  const history = [{
    offset: host.initialText.length,
    text: inlineEditSingleLineText(host.initialText),
  }]
  let historyIndex = 0

  host.cell.contentEditable = 'true'
  host.cell.setAttribute('role', 'textbox')
  host.cell.setAttribute('aria-multiline', 'false')
  host.cell.textContent = history[0].text
  collapseInlineEditSelection(host.cell, history[0].offset)

  const currentText = () => inlineEditSingleLineText(host.cell.textContent ?? '')
  const currentOffset = () => inlineEditSelectionOffset(host.cell) ?? currentText().length
  const restoreSnapshot = (snapshot: { readonly offset: number, readonly text: string }) => {
    host.cell.textContent = snapshot.text
    restoreInlineEditFocus(() => host.cell, snapshot.offset)
  }

  const remember = () => {
    const text = currentText()
    const previous = history[historyIndex]
    if (previous?.text === text) return
    history.splice(historyIndex + 1)
    history.push({ offset: currentOffset(), text })
    historyIndex = history.length - 1
  }

  const handleBeforeInput = (event: Pick<InputEvent, 'inputType' | 'preventDefault'>) => {
    const direction = inlineEditHistoryDirectionFromInputType(event.inputType)
    if (direction) {
      event.preventDefault()
      historyIndex = direction === 'undo'
        ? Math.max(0, historyIndex - 1)
        : Math.min(history.length - 1, historyIndex + 1)
      restoreSnapshot(history[historyIndex])
      return
    }

    if (isInlineEditLineBreakInput(event.inputType)) {
      event.preventDefault()
    }
  }

  const handleKeydown = (event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'preventDefault' | 'shiftKey'>) => {
    const direction = inlineEditHistoryDirectionFromKeydown(event)
    if (direction) {
      event.preventDefault()
      historyIndex = direction === 'undo'
        ? Math.max(0, historyIndex - 1)
        : Math.min(history.length - 1, historyIndex + 1)
      restoreSnapshot(history[historyIndex])
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      host.onCommit(currentText())
      host.restoreGridFocus()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      restoreSnapshot(history[0])
      host.onCancel()
      host.restoreGridFocus()
    }
  }

  const pasteText = (text: string) => {
    insertInlineEditText(host.cell, inlineEditSingleLineText(text))
    remember()
  }

  return {
    handleBeforeInput,
    handleKeydown,
    pasteText,
    remember,
  }
}
