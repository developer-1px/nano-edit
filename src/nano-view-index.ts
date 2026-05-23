import type { IndexEntry } from './nano-document-index'

export type IndexEntryAction = 'backlink' | 'external' | 'missing-note' | 'note' | 'select' | 'tag'

export interface IndexSectionView {
  title: string
  entries: readonly IndexEntry[]
  action: IndexEntryAction
}

export function indexEntryBlockIds(entry: IndexEntry): readonly string[] {
  return entry.blockIds ?? [entry.blockId]
}

export function indexEntrySymbol(action: IndexEntryAction): string {
  switch (action) {
    case 'tag':
      return 'tag'
    case 'note':
      return 'note'
    case 'missing-note':
      return '+'
    case 'backlink':
      return '<-'
    case 'external':
      return 'url'
    case 'select':
      return '•'
  }
}
