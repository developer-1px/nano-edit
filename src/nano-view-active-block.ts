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
  const block = element?.closest<HTMLElement>('.nano-block[data-id]')
  const collapsible = block?.classList.contains('nano-heading-collapsible') === true
    || block?.classList.contains('nano-list-collapsible') === true
  return collapsible ? block?.dataset.id ?? null : null
}
