// Pure data model: schemas, inferred types, and empty-value factories.
// Excludes zod-crud document engines (createNanoDocument/createNanoDeck) and
// editing-time selection helpers so this entry stays free of the persistence
// runtime and the editor surface.
export {
  NanoBlockSchema,
  NanoMarkSchema,
  NanoDocumentSchema,
  createEmptyNanoDocument,
  emptyNanoDocument,
  type NanoBlock,
  type NanoMark,
  type NanoDocument,
} from '../entities/document/nano-document'
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
} from '../entities/deck/nano-deck'
