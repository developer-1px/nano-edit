export {
  NanoDocumentSchema,
  createEmptyNanoDocument,
  emptyNanoDocument,
  type NanoBlock,
  type NanoCustomBlock,
  type NanoCustomBlockType,
  type NanoDocument,
  type NanoMark,
} from './entities/document/nano-document-model'
export { NanoBlockSchema } from './entities/block/schema/nano-block-schema'
export { NanoMarkSchema } from './entities/mark/nano-mark-schema'
export {
  createNanoDocument,
  type NanoDocumentEngine,
} from './entities/document/nano-document'
export {
  blockTextPointer,
  blocksPointer,
  point,
  pointOffset,
  pointPath,
  replaceBlocksPatch,
  selectionSnap,
} from './entities/document/nano-document-selection'
export {
  commitNanoDocumentChange,
  createNanoDocumentChange,
  isNanoDocumentChange,
  nanoDocumentChangeFromDocuments,
  nanoDocumentChangeMergeKey,
  nanoDocumentPatchFromDocuments,
  parseNanoDocumentChange,
  textMergePathForDocuments,
  type NanoDocumentChange,
} from './entities/document/nano-document-change'
export {
  commitNanoDocumentCommand,
  isNanoDocumentCommand,
  nanoDocumentChangeFromCommand,
  nanoDocumentCommandLabel,
  parseNanoDocumentCommand,
  type NanoDocumentBlockTarget,
  type NanoDocumentCommand,
  type NanoDocumentCommandCommitResult,
  type NanoDocumentCommandFailure,
  type NanoDocumentCommandOptions,
  type NanoDocumentCommandResult,
  type NanoDocumentCommandSuccess,
  type NanoDocumentInsertPosition,
  type NanoDocumentInsertBlockCommand,
  type NanoDocumentMoveBlockCommand,
  type NanoDocumentRemoveBlockCommand,
  type NanoDocumentReplaceBlockCommand,
  type NanoDocumentSetTableCellCommand,
  type NanoDocumentSetTextCommand,
} from './entities/document/nano-document-command'
export {
  applyRemoteNanoDocumentChange,
  createNanoDocumentCollaborationChange,
  nanoDocumentChangeConflictPointers,
  nanoDocumentChangeScope,
  nanoDocumentChangeTouchedPointers,
  nanoDocumentChangeTouchesPointer,
  nanoDocumentCollaborationDeliveryKey,
  nanoDocumentCollaborationNumericRevision,
  isNanoDocumentCollaborationChange,
  isOwnNanoDocumentCollaborationChange,
  parseNanoDocumentCollaborationChange,
  receiveNanoDocumentCollaborationChange,
  remoteNanoDocumentChangeOrigin,
  shouldReceiveNanoDocumentCollaborationChange,
  type ApplyRemoteNanoDocumentChangeOptions,
  type NanoDocumentChangeScope,
  type NanoDocumentCollaborationChange,
  type ReceiveNanoDocumentCollaborationChangeOptions,
} from './entities/document/nano-document-collaboration'
export {
  createNanoDocumentInMemoryCollaborationHub,
  type NanoDocumentInMemoryCollaborationDispatch,
  type NanoDocumentInMemoryCollaborationHub,
  type NanoDocumentInMemoryCollaborationPeer,
  type NanoDocumentInMemoryCollaborationPeerResult,
} from './adapters/collaboration/nano-document-in-memory-collaboration'
export {
  NanoDeckMetadataSchema,
  NanoDeckSchema,
  NanoSlideRegionKindSchema,
  NanoSlideRegionSchema,
  NanoSlideSchema,
  createEmptyNanoDeck,
  emptyNanoDeck,
  type NanoDeck,
  type NanoDeckMetadata,
  type NanoSlide,
  type NanoSlideRegion,
  type NanoSlideRegionKind,
} from './entities/deck/nano-deck-model'
export {
  createNanoDeck,
  type NanoDeckEngine,
} from './entities/deck/nano-deck'
export {
  createNanoView,
} from './view/runtime/create'
export type {
  NanoCustomBlockDescriptor,
  NanoCustomBlockReplaceOptions,
  NanoCustomBlockRenderContext,
  NanoViewHandle,
  NanoViewInspector,
  NanoViewOptions,
} from './view/runtime/types'
export {
  createNanoDeckView,
  type NanoDeckActiveSlideChange,
  type NanoDeckActiveSlideChangeReason,
  type NanoDeckViewHandle,
  type NanoDeckViewOptions,
} from './view/deck/deck-view'
export {
  defaultNanoViewFeatures,
  type NanoViewFeatureId,
} from './engine/view-features'
export {
  defaultNanoCapabilityProfileIds,
  describeNanoCapabilityProfile,
  type NanoCapabilityProfileId,
  type NanoCapabilityProfileOptions,
  type NanoCapabilityProfileSummary,
} from './engine/capability-profile'
export {
  editorPartCatalog,
  editorPartCatalogById,
  editorPartsByCategory,
  type EditorPartCatalogItem,
  type EditorPartCategory,
  type EditorPartSurface,
} from './assembly/part-catalog'
export {
  nanoDocumentFromMarkdown,
  nanoDeckFromMarkdown,
  nanoMarkdownBlockDiff,
  nanoMarkdownBlockDiffEntries,
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDeck,
  nanoMarkdownFromDocument,
  nanoTextBlockFromMarkdown,
  type NanoMarkdownBlockDiff,
  type NanoMarkdownBlockDiffIdentity,
  type NanoMarkdownBlockEntry,
  type NanoMarkdownBlockPair,
  type NanoTextBlockFromMarkdownOptions,
} from './codecs/markdown/nano-markdown'
export {
  nanoDocumentIndex,
  nanoDocumentIndexText,
  nanoDocumentSearch,
  type AttachmentIndexEntry,
  type BacklinkIndexEntry,
  type ImageIndexEntry,
  type IndexEntry,
  type NanoDocumentIndex,
  type NanoDocumentSearchResult,
  type NanoSpecialSearch,
  type TableIndexEntry,
} from './indexing/nano-document-index'
export {
  collapseInlineEditSelection,
  inlineEditHasLineBreak,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  inlineEditTextPositionAtOffset,
  insertInlineEditText,
  isInlineEditLineBreakInput,
  restoreInlineEditFocus,
  type InlineEditHistoryDirection,
  type InlineEditTextPosition,
} from './inline-edit/index'
export {
  inlineAutocompleteContextFromInput,
  inlineAutocompleteContextFromMode,
  inlineAutocompleteContextFromTrigger,
  inlineAutocompleteInsertedText,
  inlineAutocompleteMatchFromText,
  insertInlineAutocompleteText,
  replaceInlineAutocompleteText,
  type InlineAutocompleteContext,
  type InlineAutocompleteInsertOptions,
  type InlineAutocompleteMatch,
  type InlineAutocompleteTrigger,
} from './inline-autocomplete/index'
export {
  autocompleteOptionMatches,
  createAutocomplete,
  createAutocompleteSurface,
  movedAutocompleteIndex,
  nearestEnabledAutocompleteIndex,
  visibleAutocompleteOptions,
  type Autocomplete,
  type AutocompleteOption,
  type AutocompleteOptions,
  type AutocompleteState,
  type AutocompleteSurface,
  type AutocompleteSurfaceClasses,
  type AutocompleteSurfaceElements,
  type AutocompleteSurfaceOption,
  type AutocompleteSurfaceOptions,
} from './autocomplete/index'
