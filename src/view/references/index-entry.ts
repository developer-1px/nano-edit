import { EditorState, type Transaction } from 'prosemirror-state'
import type { IndexEntry } from '../../indexing/nano-document-index'
import type { IndexEntryAction } from '../index-view/index'
import { noteReferenceTransaction } from './note'
import { tagReferenceTransaction } from './tag'

export function indexEntryTransaction(
  state: EditorState,
  entry: IndexEntry,
  action: IndexEntryAction,
): Transaction | null {
  if (action === 'note' || action === 'missing-note') return noteReferenceTransaction(state, entry.target ?? entry.label)
  if (action === 'tag') return tagReferenceTransaction(state, entry.target ?? entry.label)
  return null
}
