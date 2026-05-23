import type { EditorView } from 'prosemirror-view'
import {
  blockDropTargetFromEvent,
  clearBlockDragState,
  markBlockDropTarget,
} from './nano-block-ui'
import { BLOCK_DRAG_MIME, type NanoViewContext } from './nano-view-context'
import { moveBlockToTargetTransaction } from './nano-view-block-move-transactions'

interface NanoGutterDragRuntime {
  handleBlockDragOver: (view: EditorView, event: DragEvent) => boolean
  handleBlockDragStart: (view: EditorView, event: DragEvent) => boolean
  handleBlockDrop: (view: EditorView, event: DragEvent) => boolean
}

export function createNanoGutterDragRuntime(
  ctx: NanoViewContext,
): NanoGutterDragRuntime {
  const handleBlockDragStart = (view: EditorView, _event: DragEvent): boolean => {
    clearBlockDragState(view.dom)
    return false
  }

  const handleBlockDragOver = (view: EditorView, event: DragEvent): boolean => {
    const dropTarget = blockDropTargetFromEvent(view.dom, event)
    if (!dropTarget) return false

    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    markBlockDropTarget(view.dom, dropTarget.element, dropTarget.placement)
    return true
  }

  const handleBlockDrop = (view: EditorView, event: DragEvent): boolean => {
    const sourceId = event.dataTransfer?.getData(BLOCK_DRAG_MIME)
    const dropTarget = blockDropTargetFromEvent(view.dom, event)
    clearBlockDragState(view.dom)
    if (!sourceId || !dropTarget) return false

    event.preventDefault()
    const transaction = moveBlockToTargetTransaction(
      view.state,
      sourceId,
      dropTarget.id,
      dropTarget.placement,
      ctx.collapsedBlockIds,
    )
    if (!transaction) return true

    view.dispatch(transaction.scrollIntoView())
    view.focus()
    return true
  }

  return { handleBlockDragOver, handleBlockDragStart, handleBlockDrop }
}
