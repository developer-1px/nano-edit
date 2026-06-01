import type { TodoIndexEntry } from '../../capabilities/todo/index'

export interface NanoDocumentIndex {
  outline: readonly IndexEntry[]
  tags: readonly IndexEntry[]
  noteLinks: readonly IndexEntry[]
  missingNoteLinks: readonly IndexEntry[]
  backlinks: readonly BacklinkIndexEntry[]
  externalLinks: readonly IndexEntry[]
  images: readonly ImageIndexEntry[]
  attachments: readonly AttachmentIndexEntry[]
  bookmarks: readonly IndexEntry[]
  tables: readonly TableIndexEntry[]
  callouts: readonly IndexEntry[]
  math: readonly IndexEntry[]
  footnotes: readonly IndexEntry[]
  todos: readonly TodoIndexEntry[]
}

export type NanoSpecialSearch =
  | '@attachments'
  | '@backlinks'
  | '@code'
  | '@done'
  | '@files'
  | '@images'
  | '@math'
  | '@tables'
  | '@tagged'
  | '@task'
  | '@title'
  | '@todo'
  | '@untagged'
  | '@wikilinks'

export interface NanoDocumentSearchResult {
  query: string
  blockIds: readonly string[]
  filters: readonly NanoSpecialSearch[]
  excludedFilters: readonly NanoSpecialSearch[]
  tags: readonly string[]
  exactTags: readonly string[]
  excludedTags: readonly string[]
  excludedExactTags: readonly string[]
  terms: readonly string[]
  excludedTerms: readonly string[]
}

export interface IndexEntry {
  blockId: string
  label: string
  target?: string
  blockIds?: readonly string[]
  detail?: string
}

export interface BacklinkIndexEntry extends IndexEntry {
  targetBlockId: string
}

export interface ImageIndexEntry extends IndexEntry {
  src: string
  alt: string
}

export interface AttachmentIndexEntry extends IndexEntry {
  src: string
}

export interface TableIndexEntry extends IndexEntry {
  rows: number
  columns: number
}
