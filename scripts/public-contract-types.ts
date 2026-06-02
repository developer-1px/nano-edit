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
  createContenteditableScalarEdit,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  restoreInlineEditFocus,
  type ContenteditableScalarEditHandle,
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
  const history = [{ offset: host.initialText.length, text: inlineEditSingleLineText(host.initialText) }]
  let historyIndex = 0
  const restoreSnapshot = (snapshot: { readonly offset: number, readonly text: string }) => {
    host.cell.textContent = snapshot.text
    restoreInlineEditFocus(() => host.cell, snapshot.offset)
  }
  const editor: ContenteditableScalarEditHandle = createContenteditableScalarEdit({
    element: host.cell,
    initialSelection: { kind: 'end' },
    initialText: host.initialText,
    lineBreak: 'single-line',
    onDraftChange: (snapshot) => {
      const previous = history[historyIndex]
      if (previous?.text === snapshot.text) return
      history.splice(historyIndex + 1)
      history.push({ offset: snapshot.offset, text: snapshot.text })
      historyIndex = history.length - 1
    },
    onHistoryIntent: (intent) => {
      historyIndex = intent.direction === 'undo'
        ? Math.max(0, historyIndex - 1)
        : Math.min(history.length - 1, historyIndex + 1)
      restoreSnapshot(history[historyIndex])
    },
    onCommit: (commit) => host.onCommit(commit.text),
    onCancel: host.onCancel,
    restoreHostFocus: host.restoreGridFocus,
  })

  return {
    editor,
    pasteText: editor.insertText,
  }
}
