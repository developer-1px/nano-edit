import type { MarkType } from 'prosemirror-model'
import type { EditorState } from 'prosemirror-state'
import type { MarkName } from './types'

export function markTypeForName(state: EditorState, markName: MarkName): MarkType | null {
  return state.schema.marks[markName] ?? null
}
