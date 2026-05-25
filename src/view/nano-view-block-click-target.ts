import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  blockClickOptionForNode,
  blockClickOptions,
  type BlockClickEntry,
} from '../blocks/nano-block-options'

export function blockClickActionFromEventTarget(
  doc: ProseMirrorNode,
  target: EventTarget | null,
): { option: BlockClickEntry; position: number } | null {
  const targetElement = blockClickTargetFromEventTarget(target)
  const id = targetElement?.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id
  if (!id) return null

  let action: { option: BlockClickEntry; position: number } | null = null
  doc.descendants((node, nodePosition) => {
    if (action) return false
    const option = blockClickOptionForNode(node)
    if (option && node.attrs.id === id) {
      action = { option, position: nodePosition }
      return false
    }
    return true
  })
  return action
}

export function blockClickTargetFromEventTarget(target: EventTarget | null): Element | null {
  for (const option of blockClickOptions()) {
    const element = option.click.target(target)
    if (element) return element
  }
  return null
}
