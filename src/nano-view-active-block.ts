import type { EditorState } from 'prosemirror-state'
import { activeBlockRange } from './nano-block-structure'

export function activeBlockId(state: EditorState): string | null {
  const block = activeBlockRange(state)
  if (!block) return null

  const id = block.node.attrs.id
  return typeof id === 'string' && id ? id : null
}

export function listFoldBlockIdFromEventTarget(target: EventTarget | null): string | null {
  const element = target instanceof Element
    ? target.closest<HTMLElement>('.nano-list-fold, .nano-heading-fold')
    : null
  return element?.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id ?? null
}
