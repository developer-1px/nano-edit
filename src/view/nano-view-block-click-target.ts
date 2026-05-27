import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  blockClickOptionForNode,
  blockClickOptions,
  type BlockOptionRegistry,
  type BlockClickEntry,
} from '../blocks/nano-block-options'

export function blockClickActionFromEventTarget(
  doc: ProseMirrorNode,
  target: EventTarget | null,
  registry?: BlockOptionRegistry,
): { option: BlockClickEntry; position: number } | null {
  const targetElement = blockClickTargetFromEventTarget(target)
  const id = targetElement?.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id
  if (!id) return null

  let action: { option: BlockClickEntry; position: number } | null = null
  doc.descendants((node, nodePosition) => {
    if (action) return false
    const option = registry
      ? registry.blockClickOptionForNode(node)
      : blockClickOptionForNode(node)
    if (option && node.attrs.id === id) {
      action = { option, position: nodePosition }
      return false
    }
    return true
  })
  return action
}

export function blockClickTargetFromEventTarget(
  target: EventTarget | null,
  registry?: BlockOptionRegistry,
): Element | null {
  for (const option of (registry ? registry.blockClickOptions() : blockClickOptions())) {
    const element = option.click.target(target)
    if (element) return element
  }
  return null
}
