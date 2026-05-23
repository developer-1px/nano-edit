import { EditorState, type Transaction } from 'prosemirror-state'
import type { IndexEntry } from './nano-document-index'
import type { IndexEntryAction } from './nano-view-index'
import { noteReferenceTransaction } from './nano-view-note-reference-transactions'
import { tagReferenceTransaction } from './nano-view-tag-reference-transactions'

export function indexEntryTransaction(
  state: EditorState,
  entry: IndexEntry,
  action: IndexEntryAction,
): Transaction | null {
  if (action === 'note' || action === 'missing-note') return noteReferenceTransaction(state, entry.target ?? entry.label)
  if (action === 'tag') return tagReferenceTransaction(state, entry.target ?? entry.label)
  return null
}
