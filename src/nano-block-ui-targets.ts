import type { DropPlacement } from './nano-block-ui-types'

export function blockDropTargetFromEvent(root: HTMLElement, event: DragEvent): {
  element: HTMLElement
  id: string
  placement: DropPlacement
} | null {
  const element = blockElementFromEvent(root, event)
  const id = element?.dataset.id
  if (!element || !id) return null

  const rect = element.getBoundingClientRect()
  return {
    element,
    id,
    placement: event.clientY > rect.top + rect.height / 2 ? 'after' : 'before',
  }
}

export function blockElementFromEvent(root: HTMLElement, event: DragEvent): HTMLElement | null {
  const target = event.target instanceof Element
    ? event.target.closest<HTMLElement>('.nano-block[data-id]')
    : null
  if (target && root.contains(target)) return target

  const pointTarget = document.elementFromPoint(event.clientX, event.clientY)
  const pointBlock = pointTarget?.closest<HTMLElement>('.nano-block[data-id]') ?? null
  return pointBlock && root.contains(pointBlock) ? pointBlock : null
}

export function markBlockDropTarget(
  root: HTMLElement,
  element: HTMLElement,
  placement: DropPlacement,
): void {
  clearBlockDropTargets(root)
  element.classList.add(placement === 'before' ? 'nano-drop-before' : 'nano-drop-after')
}

export function clearBlockDropTargets(root: HTMLElement): void {
  root.querySelectorAll('.nano-drop-before, .nano-drop-after').forEach((element) => {
    element.classList.remove('nano-drop-before', 'nano-drop-after')
  })
}

export function markBlockDragSource(root: HTMLElement, id: string): void {
  clearBlockDragState(root)
  root.classList.add('nano-dragging')
  blockElementById(root, id)?.classList.add('nano-block-drag-source')
}

export function clearBlockDragState(root: HTMLElement): void {
  clearBlockDropTargets(root)
  root.classList.remove('nano-dragging')
  root.querySelectorAll('.nano-block-drag-source').forEach((element) => {
    element.classList.remove('nano-block-drag-source')
  })
}

export function blockElementById(root: HTMLElement, id: string): HTMLElement | null {
  const blocks = root.querySelectorAll<HTMLElement>('.nano-block[data-id]')
  for (const block of blocks) {
    if (block.dataset.id === id) return block
  }
  return null
}
