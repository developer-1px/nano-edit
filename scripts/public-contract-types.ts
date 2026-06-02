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
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  restoreInlineEditFocus,
} from 'nano-edit/inline-edit'

type InlineMode = 'mention' | 'command'

interface PublicOption extends AutocompleteOption {
  insertText: string
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
