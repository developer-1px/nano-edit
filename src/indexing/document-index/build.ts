import {
  todoIndexEntryFromBlock,
  type TodoIndexEntry,
} from '../../capabilities/todo/indexing'
import { NanoDocumentSchema, type NanoBlock, type NanoDocument } from '../../entities/document/nano-document-model'
import { footnoteLabel } from '../../entities/reference/nano-footnote'
import { noteLinkLabel } from '../../entities/reference/nano-note-link'
import {
  calloutBlockLabel,
  footnoteBlockLabel,
  indexBlockLabel,
  headingBlockLabel,
  mathBlockLabel,
  noteRefIndexLabel,
} from './block-labels'
import {
  blockMarks,
  markedText,
} from './label-marks'
import {
  attachmentIndexLabel,
  bookmarkIndexLabel,
  externalLinkLabel,
  normalizeNoteTarget,
  noteTargetFromLabel,
} from './link-labels'
import { indexRawMarkdownText, pushTagIndexEntries } from './raw'
import {
  groupedReferenceEntries,
  noteLinkDisplayLabel,
} from './references'
import type {
  AttachmentIndexEntry,
  BacklinkIndexEntry,
  ImageIndexEntry,
  IndexEntry,
  NanoDocumentIndex,
  TableIndexEntry,
} from './types'

interface NanoDocumentIndexState {
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

export function nanoDocumentIndex(document: NanoDocument): NanoDocumentIndex {
  const validDocument = NanoDocumentSchema.parse(document)
  const state = createNanoDocumentIndexState()

  for (const block of validDocument.blocks) {
    indexDocumentBlock(state, block)
  }

  resolveDocumentBacklinks(state)
  return nanoDocumentIndexFromState(state)
}

function createNanoDocumentIndexState(): NanoDocumentIndexState {
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

function nanoDocumentIndexFromState(state: NanoDocumentIndexState): NanoDocumentIndex {
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

function indexDocumentBlock(state: NanoDocumentIndexState, block: NanoBlock): void {
  state.blockLabels.set(block.id, indexBlockLabel(block))
  if (block.type === 'heading') indexHeadingBlock(state, block)
  if (block.type === 'image') {
    const alt = block.alt ?? ''
    state.images.push({ blockId: block.id, label: alt || 'Image', target: block.src, src: block.src, alt })
  }
  if (block.type === 'bookmark') {
    const label = bookmarkIndexLabel(block)
    state.bookmarks.push({ blockId: block.id, label, target: block.href })
    state.externalLinks.push({ blockId: block.id, label, target: block.href })
  }
  if (block.type === 'attachment') {
    state.attachments.push({ blockId: block.id, label: attachmentIndexLabel(block), target: block.src, src: block.src })
  }
  if (block.type === 'note_ref') indexNoteReferenceBlock(state, block)
  if (block.type === 'tag_ref') pushTagIndexEntries(state.tags, block.id, block.name)
  if (block.type === 'callout') state.callouts.push({ blockId: block.id, label: calloutBlockLabel(block) })
  if (block.type === 'math') state.math.push({ blockId: block.id, label: mathBlockLabel(block.text) })
  if (block.type === 'footnote') {
    state.footnotes.push({
      blockId: block.id,
      label: footnoteBlockLabel(block),
      target: footnoteLabel(block.name) ?? `[^${block.name}]`,
    })
  }
  if (block.type === 'table') indexTableBlock(state, block)

  const todo = todoIndexEntryFromBlock(block)
  if (todo) state.todos.push(todo)
  indexDocumentBlockMarks(state, block)
}

function indexHeadingBlock(state: NanoDocumentIndexState, block: Extract<NanoBlock, { type: 'heading' }>): void {
  state.outline.push({ blockId: block.id, label: headingBlockLabel(block) })
  state.headingTargets.set(normalizeNoteTarget(block.text), block.id)
}

function indexNoteReferenceBlock(state: NanoDocumentIndexState, block: Extract<NanoBlock, { type: 'note_ref' }>): void {
  const target = noteLinkLabel(block.target)
  if (target) state.noteLinks.push({ blockId: block.id, label: noteRefIndexLabel(block), target })
}

function indexTableBlock(state: NanoDocumentIndexState, block: Extract<NanoBlock, { type: 'table' }>): void {
  const columns = Math.max(0, ...block.rows.map((row) => row.length))
  state.tables.push({ blockId: block.id, label: `${block.rows.length}x${columns}`, rows: block.rows.length, columns })
  for (const row of block.rows) {
    for (const cell of row) {
      indexRawMarkdownText(cell, block.id, state)
    }
  }
}

function indexDocumentBlockMarks(state: NanoDocumentIndexState, block: NanoBlock): void {
  for (const mark of blockMarks(block)) {
    if (mark.type === 'tag') pushTagIndexEntries(state.tags, block.id, mark.name)
    if (mark.type === 'note_link') {
      const raw = markedText(block, mark)
      const label = noteLinkDisplayLabel(raw, mark.target)
      const target = noteLinkLabel(mark.target)
      if (label && target) state.noteLinks.push({ blockId: block.id, label, target })
    }
    if (mark.type === 'link') {
      const label = markedText(block, mark) || mark.href
      state.externalLinks.push({ blockId: block.id, label: externalLinkLabel(label, mark), target: mark.href })
    }
    if (mark.type === 'math') {
      state.math.push({ blockId: block.id, label: mark.formula })
    }
    if (mark.type === 'footnote_ref') {
      state.footnotes.push({
        blockId: block.id,
        label: mark.name,
        target: footnoteLabel(mark.name) ?? `[^${mark.name}]`,
      })
    }
  }
}

function resolveDocumentBacklinks(state: NanoDocumentIndexState): void {
  for (const noteLink of state.noteLinks) {
    const target = noteTargetFromLabel(noteLink.target ?? noteLink.label)
    const targetBlockId = target ? state.headingTargets.get(normalizeNoteTarget(target)) : null
    if (targetBlockId) {
      state.backlinks.push({
        blockId: noteLink.blockId,
        targetBlockId,
        label: `${state.blockLabels.get(noteLink.blockId) ?? noteLink.blockId} -> ${target}`,
      })
    } else if (target) {
      state.missingNoteLinks.push(noteLink)
    }
  }
}
