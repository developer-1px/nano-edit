// Pure data model: schemas, inferred types, and empty-value factories.
// Excludes json-document engines (createNanoDocument/createNanoDeck) and
// editing-time selection helpers so this entry stays free of the persistence
// runtime and the editor surface.
export {
  NanoDocumentSchema,
  createNanoParagraphBlock,
  createEmptyNanoDocument,
  emptyNanoDocument,
  type CreateNanoParagraphBlockOptions,
  type NanoBlock,
  type NanoCustomBlock,
  type NanoCustomBlockType,
  type NanoMark,
  type NanoParagraphBlock,
  type NanoDocument,
} from '../entities/document/nano-document-model'
export { NanoBlockSchema } from '../entities/block/schema/nano-block-schema'
export { NanoMarkSchema } from '../entities/mark/nano-mark-schema'
export {
  NanoDeckSchema,
  NanoSlideSchema,
  NanoSlideRegionSchema,
  NanoDeckMetadataSchema,
  NanoSlideRegionKindSchema,
  createEmptyNanoDeck,
  emptyNanoDeck,
  type NanoDeck,
  type NanoSlide,
  type NanoSlideRegion,
  type NanoDeckMetadata,
  type NanoSlideRegionKind,
} from '../entities/deck/nano-deck-model'
