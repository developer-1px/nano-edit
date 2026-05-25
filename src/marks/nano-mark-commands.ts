import { toggleMark } from 'prosemirror-commands'
import type { Command, EditorState } from 'prosemirror-state'
import type { MarkName, MarkOption } from './nano-mark-types'
import { markTypeForName } from './nano-mark-type'

export function markCommand(option: MarkOption): Command {
  return (state, dispatch, view) => {
    const markType = markTypeForName(state, option.markName)
    if (!markType) return false
    return toggleMark(markType)(state, dispatch, view)
  }
}

export function isMarkOptionActive(state: EditorState, option: MarkOption): boolean {
  return isMarkActive(state, option.markName)
}

export function isMarkActive(state: EditorState, markName: MarkName): boolean {
  const markType = markTypeForName(state, markName)
  if (!markType) return false

  const { empty, from, to, $from } = state.selection
  if (empty) return markType.isInSet(state.storedMarks ?? $from.marks()) !== undefined

  return state.doc.rangeHasMark(from, to, markType)
}
