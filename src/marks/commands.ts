import { toggleMark } from 'prosemirror-commands'
import type { Command } from 'prosemirror-state'
import type { MarkOption } from './types'
import { markTypeForName } from './mark-type'

export function markCommand(option: MarkOption): Command {
  return (state, dispatch, view) => {
    const markType = markTypeForName(state, option.markName)
    if (!markType) return false
    return toggleMark(markType)(state, dispatch, view)
  }
}
