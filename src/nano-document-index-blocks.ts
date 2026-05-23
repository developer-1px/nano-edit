import {
  todoIndexEntryFromBlock,
} from './capabilities/todo/index'
import type { NanoBlock } from './nano-core'
import { footnoteLabel } from './nano-footnote'
import { noteLinkLabel } from './nano-note-link'
import {
  attachmentIndexLabel,
  bookmarkIndexLabel,
  calloutBlockLabel,
  footnoteBlockLabel,
  indexBlockLabel,
  headingBlockLabel,
  mathBlockLabel,
  normalizeNoteTarget,
  noteRefIndexLabel,
} from './nano-document-index-labels'
import { indexDocumentBlockMarks } from './nano-document-index-block-marks'
import { indexRawMarkdownText, pushTagIndexEntries } from './nano-document-index-raw'
import type { NanoDocumentIndexState } from './nano-document-index-state'

export function indexDocumentBlock(state: NanoDocumentIndexState, block: NanoBlock): void {
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
