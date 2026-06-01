import {
  todoIndexTextLabel,
} from '../../capabilities/todo/index'
import type { NanoDocument } from '../../core/nano-core'
import { nanoDocumentIndex } from './build'
import type { IndexEntry } from './types'

export function nanoDocumentIndexText(document: NanoDocument): string {
  const index = nanoDocumentIndex(document)
  return [
    indexSection('outline', index.outline),
    indexSection('tags', index.tags),
    indexSection('note links', index.noteLinks),
    indexSection('missing notes', index.missingNoteLinks),
    indexSection('backlinks', index.backlinks),
    indexSection('external links', index.externalLinks),
    indexSection('images', index.images),
    indexSection('attachments', index.attachments),
    indexSection('bookmarks', index.bookmarks),
    indexSection('tables', index.tables),
    indexSection('callouts', index.callouts),
    indexSection('math', index.math),
    indexSection('footnotes', index.footnotes),
    indexSection('todos', index.todos.map((todo) => ({
      blockId: todo.blockId,
      label: todoIndexTextLabel(todo),
    }))),
  ].join('\n\n')
}

function indexSection(title: string, entries: readonly IndexEntry[]): string {
  return [
    title,
    entries.length > 0
      ? entries.map((entry) => `${entry.label}  ${entry.blockId}`).join('\n')
      : '(none)',
  ].join('\n')
}
