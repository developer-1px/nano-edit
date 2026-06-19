import {
  applyRemoteNanoDocumentChange,
  commitNanoDocumentCommand,
  createNanoDocumentInMemoryCollaborationHub,
  createNanoDeck,
  createNanoDeckView,
  commitNanoDocumentChange,
  createNanoDocument,
  createNanoDocumentChange,
  createNanoDocumentCollaborationChange,
  createNanoView,
  isNanoDocumentCommand,
  isNanoDocumentChange,
  nanoDocumentChangeFromCommand,
  nanoDocumentChangeScope,
  nanoDocumentChangeFromDocuments,
  nanoDocumentChangeMergeKey,
  nanoDocumentPatchFromDocuments,
  nanoDocumentChangeConflictPointers,
  nanoDocumentChangeTouchedPointers,
  nanoDocumentChangeTouchesPointer,
  nanoDocumentCollaborationDeliveryKey,
  nanoDocumentCollaborationNumericRevision,
  nanoDocumentCommandLabel,
  isNanoDocumentCollaborationChange,
  isOwnNanoDocumentCollaborationChange,
  parseNanoDocumentCommand,
  parseNanoDocumentChange,
  parseNanoDocumentCollaborationChange,
  receiveNanoDocumentCollaborationChange,
  remoteNanoDocumentChangeOrigin,
  shouldReceiveNanoDocumentCollaborationChange,
  type NanoDocumentChange,
  type NanoDocumentChangeScope,
  type NanoDocumentCollaborationChange,
  type NanoDocumentCommand,
  type NanoDocumentCommandResult,
  type NanoDocumentMoveBlockCommand,
  type NanoDocumentInMemoryCollaborationDispatch,
  type NanoDocumentInMemoryCollaborationHub,
  type NanoDocumentInMemoryCollaborationPeer,
  type NanoDeckActiveSlideChange,
  type NanoDeckViewOptions,
  type NanoDeckViewHandle,
  type ReceiveNanoDocumentCollaborationChangeOptions,
  type NanoViewHandle,
  type NanoViewInspector,
  type NanoViewOptions,
} from 'nano-edit'
import 'nano-edit/style.css'
import {
  nanoDeckFromMarkdown,
  nanoDocumentFromMarkdown,
  nanoMarkdownBlockDiff,
  nanoMarkdownFromDeck,
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
  nanoTextBlockFromMarkdown,
  type NanoMarkdownBlockDiff,
  type NanoMarkdownBlockEntry,
  type NanoTextBlockFromMarkdownOptions,
} from 'nano-edit/markdown'
import {
  nanoDocumentIndex,
  nanoDocumentSearch,
  type NanoDocumentIndex,
  type NanoDocumentSearchResult,
  type NanoSpecialSearch,
} from 'nano-edit/document-index'
import {
  NanoDeckSchema,
  NanoDocumentSchema,
  createEmptyNanoDocument,
  createEmptyNanoDeck,
  type NanoDeck,
  type NanoDocument,
} from 'nano-edit/model'
import {
  createAutocomplete,
  visibleAutocompleteOptions,
  type Autocomplete,
  type AutocompleteOption,
  type AutocompleteSurfaceOption,
} from 'nano-edit/autocomplete'
import {
  externalUrlTokensInText,
  noteLinkTokensInText,
  tagTokensInText,
  type NoteLinkToken,
  type TagToken,
  type UrlToken,
} from 'nano-edit/inline-tokens'
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
import {
  createSuggestionSurface,
  suggestionOptionMatches,
  visibleSuggestionOptions,
  type SuggestionSurface,
  type SuggestionSurfaceOption,
  type SuggestionSurfaceOptions,
} from 'nano-edit/suggestion'

type InlineMode = 'mention' | 'command'

interface PublicOption extends AutocompleteOption {
  insertText: string
}

interface PublicSurfaceOption extends AutocompleteSurfaceOption {
  insertText: string
}

interface PublicSuggestionOption extends SuggestionSurfaceOption {
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
  const rootDocument: NanoDocument = nanoDocumentFromMarkdown('# Root entry')
  const observedLocalChanges: NanoDocumentChange[] = []
  const embeddedInspector: NanoViewInspector = 'disabled'
  const viewOptions: NanoViewOptions = {
    mount,
    engine: createNanoDocument(rootDocument),
    inspector: embeddedInspector,
    onLocalChange: (change) => observedLocalChanges.push(change),
  }
  const view: NanoViewHandle = createNanoView(viewOptions)

  const modelDocument = createEmptyNanoDocument()
  const changedModelDocument: NanoDocument = {
    blocks: [
      {
        id: 'public-contract-change',
        marks: [],
        text: 'Changed through NanoDocumentChange',
        type: 'paragraph',
      },
    ],
  }
  const documentChange: NanoDocumentChange | null = nanoDocumentChangeFromDocuments(modelDocument, changedModelDocument, {
    label: 'public contract change',
    origin: 'public-contract',
  })
  const manualDocumentChange: NanoDocumentChange = createNanoDocumentChange({
    label: 'manual public contract change',
    operations: [],
    origin: 'public-contract',
  })
  const parsedDocumentChange: NanoDocumentChange | null = parseNanoDocumentChange(documentChange)
  const isDocumentChange: boolean = isNanoDocumentChange(documentChange)
  const documentChangeMergeKey: string | undefined = documentChange ? nanoDocumentChangeMergeKey(documentChange) : undefined
  const documentPatch = nanoDocumentPatchFromDocuments(modelDocument, changedModelDocument)
  const documentChangeEngine = createNanoDocument(modelDocument)
  if (documentChange) commitNanoDocumentChange(documentChangeEngine, documentChange)
  const documentCommand: NanoDocumentCommand = {
    kind: 'nano-document.command.set-text',
    target: { blockIndex: 0 },
    text: 'Changed through NanoDocumentCommand',
  }
  const parsedDocumentCommand: NanoDocumentCommand | null = parseNanoDocumentCommand(documentCommand)
  const isDocumentCommand: boolean = isNanoDocumentCommand(documentCommand)
  const documentCommandResult: NanoDocumentCommandResult = nanoDocumentChangeFromCommand(modelDocument, documentCommand)
  const documentCommandLabel: string = nanoDocumentCommandLabel(documentCommand)
  const documentCommandEngine = createNanoDocument(modelDocument)
  const documentCommandCommit = commitNanoDocumentCommand(documentCommandEngine, documentCommand)
  const documentMoveCommand: NanoDocumentMoveBlockCommand = {
    kind: 'nano-document.command.move-block',
    target: { blockIndex: 0 },
    to: { afterBlockId: 'move-target' },
  }
  const documentMoveCommandResult: NanoDocumentCommandResult = nanoDocumentChangeFromCommand({
    blocks: [
      { id: 'move-source', marks: [], text: 'Move source', type: 'paragraph' },
      { id: 'move-target', marks: [], text: 'Move target', type: 'paragraph' },
    ],
  }, documentMoveCommand)
  if (!documentMoveCommandResult.ok) throw new Error(documentMoveCommandResult.reason)
  const collaborationEngine = createNanoDocument(modelDocument)
  const collaborationMirrorEngine = createNanoDocument(modelDocument)
  const collaborationMessage: NanoDocumentCollaborationChange | null = documentChange
    ? createNanoDocumentCollaborationChange(documentChange, { peerId: 'public-contract-peer', revision: 1 })
    : null
  const parsedCollaborationMessage: NanoDocumentCollaborationChange | null = parseNanoDocumentCollaborationChange(
    collaborationMessage,
  )
  const isCollaborationMessage: boolean = isNanoDocumentCollaborationChange(collaborationMessage)
  const receiveOptions: ReceiveNanoDocumentCollaborationChangeOptions = {
    localPeerId: 'public-contract-peer',
  }
  const isOwnCollaborationMessage = collaborationMessage
    ? isOwnNanoDocumentCollaborationChange(collaborationMessage, receiveOptions.localPeerId)
    : false
  const shouldReceiveCollaborationMessage = collaborationMessage
    ? shouldReceiveNanoDocumentCollaborationChange(collaborationMessage, receiveOptions)
    : false
  const collaborationScope: NanoDocumentChangeScope | null = documentChange
    ? nanoDocumentChangeScope(documentChange)
    : null
  const collaborationPointers = documentChange ? nanoDocumentChangeTouchedPointers(documentChange) : []
  const collaborationConflictPointers = documentChange
    ? nanoDocumentChangeConflictPointers(documentChange, [documentChange])
    : []
  const collaborationTouchesBlocks = documentChange
    ? nanoDocumentChangeTouchesPointer(documentChange, '/blocks')
    : false
  const collaborationDeliveryKey = collaborationMessage
    ? nanoDocumentCollaborationDeliveryKey(collaborationMessage)
    : null
  const collaborationNumericRevision = collaborationMessage
    ? nanoDocumentCollaborationNumericRevision(collaborationMessage)
    : null
  const remoteOrigin = remoteNanoDocumentChangeOrigin('public-contract-peer')
  if (documentChange) applyRemoteNanoDocumentChange(collaborationEngine, documentChange)
  if (collaborationMessage) receiveNanoDocumentCollaborationChange(collaborationEngine, collaborationMessage, receiveOptions)
  const collaborationHub: NanoDocumentInMemoryCollaborationHub = createNanoDocumentInMemoryCollaborationHub()
  const localCollaborationPeer: NanoDocumentInMemoryCollaborationPeer = collaborationHub.connect({
    engine: collaborationEngine,
    peerId: 'public-contract-peer',
  })
  const mirrorCollaborationPeer: NanoDocumentInMemoryCollaborationPeer = collaborationHub.connect({
    engine: collaborationMirrorEngine,
    peerId: 'public-contract-mirror',
  })
  const collaborationDispatch: NanoDocumentInMemoryCollaborationDispatch | null = documentChange
    ? localCollaborationPeer.publish(documentChange, { revision: 2 })
    : null
  const invalidCollaborationReceive = localCollaborationPeer.receive({ kind: 'not-a-nano-change' })
  mirrorCollaborationPeer.disconnect()
  const modelDeck = createEmptyNanoDeck()
  const modelDocumentValidation = NanoDocumentSchema.safeParse(modelDocument)
  const modelDeckValidation = NanoDeckSchema.safeParse(modelDeck)
  const parsedDocument = nanoDocumentFromMarkdown('# Markdown\n\n- [ ] Task')
  const parsedDeck: NanoDeck = nanoDeckFromMarkdown('# Slide\n\nBody')
  const observedDeckSlides: NanoDeckActiveSlideChange[] = []
  const deckMount = document.createElement('div')
  const deckViewOptions: NanoDeckViewOptions = {
    mount: deckMount,
    engine: createNanoDeck(parsedDeck),
    onActiveSlideChange: (change) => observedDeckSlides.push(change),
  }
  const deckView: NanoDeckViewHandle = createNanoDeckView(deckViewOptions)
  const deckMarkdownSource: string = nanoMarkdownFromDeck(parsedDeck)
  const markdownBlocks: readonly NanoMarkdownBlockEntry[] = nanoMarkdownBlocksFromDocument(parsedDocument)
  const markdownBlockDiff: NanoMarkdownBlockDiff = nanoMarkdownBlockDiff('Alpha\n\nBeta', 'Alpha\n\nInserted\n\nBeta')
  const markdownSource: string = nanoMarkdownFromDocument(parsedDocument)
  const textBlockOptions: NanoTextBlockFromMarkdownOptions = { id: 'public-contract-text-block' }
  const rootTextBlock = nanoTextBlockFromMarkdown('Root [[Roadmap]] #nano', textBlockOptions)
  const markdownTextBlock = nanoTextBlockFromMarkdown('Markdown [[Roadmap]] #nano', textBlockOptions)
  const tagTokens: readonly TagToken[] = tagTokensInText('#nano [[Roadmap]] https://example.com')
  const noteLinkTokens: readonly NoteLinkToken[] = noteLinkTokensInText('#nano [[Roadmap]] https://example.com')
  const urlTokens: readonly UrlToken[] = externalUrlTokensInText('#nano [[Roadmap]] https://example.com')

  const index: NanoDocumentIndex = nanoDocumentIndex(parsedDocument)
  const specialSearch: NanoSpecialSearch = '@title'
  const search: NanoDocumentSearchResult | null = nanoDocumentSearch(parsedDocument, `${specialSearch} Markdown`)

  const triggers: readonly InlineAutocompleteTrigger<InlineMode>[] = [
    { mode: 'mention', trigger: '@' },
    { mode: 'command', trigger: '/' },
  ]
  const match: InlineAutocompleteMatch<InlineMode> | null = inlineAutocompleteMatchFromText('@mi', 3, triggers)
  const options: readonly PublicOption[] = [
    { id: 'mina', title: 'Mina', insertText: '@Mina' },
  ]
  const surfaceOptions: readonly PublicSurfaceOption[] = options
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
    collaborationConflictPointers,
    collaborationDeliveryKey,
    collaborationEngine,
    collaborationDispatch,
    collaborationHub,
    collaborationNumericRevision,
    isCollaborationMessage,
    isOwnCollaborationMessage,
    collaborationMessage,
    collaborationPointers,
    collaborationScope,
    collaborationTouchesBlocks,
    deckMarkdownSource,
    deckView,
    documentChange,
    documentChangeEngine,
    isDocumentChange,
    documentChangeMergeKey,
    documentPatch,
    documentCommandCommit,
    documentCommandEngine,
    isDocumentCommand,
    documentCommandLabel,
    documentCommandResult,
    index,
    invalidCollaborationReceive,
    markdownBlocks,
    markdownBlockDiff,
    markdownSource,
    markdownTextBlock,
    manualDocumentChange,
    modelDeck,
    modelDeckValidation,
    modelDocument,
    modelDocumentValidation,
    noteLinkTokens,
    observedLocalChanges,
    observedDeckSlides,
    parsedCollaborationMessage,
    parsedDocumentCommand,
    parsedDocumentChange,
    remoteOrigin,
    rootTextBlock,
    search,
    shouldReceiveCollaborationMessage,
    specialSearch,
    surfaceOptions,
    tagTokens,
    urlTokens,
    view,
  }
}

export function exerciseNanoEditModelValidation(input: unknown) {
  const documentResult = NanoDocumentSchema.safeParse(input)
  const deckResult = NanoDeckSchema.safeParse(input)
  const deck: NanoDeck | null = deckResult.success ? deckResult.data : null
  const document: NanoDocument | null = documentResult.success ? documentResult.data : null

  return {
    deck,
    document,
  }
}

export function exerciseNanoEditSuggestionCompatibility() {
  const options: readonly PublicSuggestionOption[] = [
    { id: 'save', title: 'Save', insertText: '/save', keywords: ['write'] },
  ]
  const surfaceOptions: SuggestionSurfaceOptions<PublicSuggestionOption, InlineMode> = {
    inputType: 'search',
    options: (_mode, query) => visibleSuggestionOptions(options, query),
    placeholder: (mode) => mode,
    run: (_option, _mode) => {},
  }
  const surface: SuggestionSurface<InlineMode, PublicSuggestionOption> = createSuggestionSurface(surfaceOptions)
  const visible = visibleSuggestionOptions(options, 'sav')
  const matches = suggestionOptionMatches(options[0], 'write')

  return {
    matches,
    surface,
    visible,
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
