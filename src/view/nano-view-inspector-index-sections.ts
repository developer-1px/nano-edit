import type { IndexEntry, NanoDocumentIndex } from '../indexing/nano-document-index'
import type { IndexSectionView } from './nano-view-index'

export function inspectorIndexSections(index: NanoDocumentIndex): IndexSectionView[] {
  const todoEntries: IndexEntry[] = index.todos.map((todo) => ({
    blockId: todo.blockId,
    label: `${todo.checked ? '✓' : '□'} ${todo.label}`,
  }))
  return [
    { title: 'outline', entries: index.outline, action: 'select' },
    { title: 'tags', entries: index.tags, action: 'tag' },
    { title: 'note links', entries: index.noteLinks, action: 'note' },
    { title: 'missing notes', entries: index.missingNoteLinks, action: 'missing-note' },
    { title: 'backlinks', entries: index.backlinks, action: 'backlink' },
    { title: 'external links', entries: index.externalLinks, action: 'external' },
    { title: 'images', entries: index.images, action: 'select' },
    { title: 'attachments', entries: index.attachments, action: 'select' },
    { title: 'bookmarks', entries: index.bookmarks, action: 'select' },
    { title: 'tables', entries: index.tables, action: 'select' },
    { title: 'callouts', entries: index.callouts, action: 'select' },
    { title: 'math', entries: index.math, action: 'select' },
    { title: 'footnotes', entries: index.footnotes, action: 'select' },
    { title: 'todos', entries: todoEntries, action: 'select' },
  ]
}
