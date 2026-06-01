import type { TodoIndexEntry } from '../../capabilities/todo/index'
import {
  groupedReferenceEntries,
} from './references'
import type {
  AttachmentIndexEntry,
  BacklinkIndexEntry,
  ImageIndexEntry,
  IndexEntry,
  NanoDocumentIndex,
  TableIndexEntry,
} from './types'

export interface NanoDocumentIndexState {
  outline: IndexEntry[]
  tags: IndexEntry[]
  noteLinks: IndexEntry[]
  missingNoteLinks: IndexEntry[]
  backlinks: BacklinkIndexEntry[]
  externalLinks: IndexEntry[]
  images: ImageIndexEntry[]
  attachments: AttachmentIndexEntry[]
  bookmarks: IndexEntry[]
  tables: TableIndexEntry[]
  callouts: IndexEntry[]
  math: IndexEntry[]
  footnotes: IndexEntry[]
  todos: TodoIndexEntry[]
  headingTargets: Map<string, string>
  blockLabels: Map<string, string>
}

export function createNanoDocumentIndexState(): NanoDocumentIndexState {
  return {
    outline: [],
    tags: [],
    noteLinks: [],
    missingNoteLinks: [],
    backlinks: [],
    externalLinks: [],
    images: [],
    attachments: [],
    bookmarks: [],
    tables: [],
    callouts: [],
    math: [],
    footnotes: [],
    todos: [],
    headingTargets: new Map(),
    blockLabels: new Map(),
  }
}

export function nanoDocumentIndexFromState(state: NanoDocumentIndexState): NanoDocumentIndex {
  return {
    outline: state.outline,
    tags: groupedReferenceEntries(state.tags, state.blockLabels),
    noteLinks: groupedReferenceEntries(state.noteLinks, state.blockLabels),
    missingNoteLinks: groupedReferenceEntries(state.missingNoteLinks, state.blockLabels),
    backlinks: state.backlinks,
    externalLinks: state.externalLinks,
    images: state.images,
    attachments: state.attachments,
    bookmarks: state.bookmarks,
    tables: state.tables,
    callouts: state.callouts,
    math: state.math,
    footnotes: groupedReferenceEntries(state.footnotes, state.blockLabels),
    todos: state.todos,
  }
}
