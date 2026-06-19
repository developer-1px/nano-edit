import { EditorState } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../../assembly/capability'

export function blockKeyboardContext(state: EditorState): BlockKeyboardContext | null {
  const { selection } = state
  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  if (!block.isTextblock) return null

  return {
    state,
    $from,
    block,
    blockPosition: $from.before(),
  }
}
