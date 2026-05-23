import type { EditorView } from 'prosemirror-view'
import type { NanoViewContext } from './nano-view-context'
import { createNanoGutterDragRuntime } from './nano-view-gutter-drag-runtime'
import { createNanoGutterKeyboardRuntime } from './nano-view-gutter-keyboard-runtime'

export interface NanoGutterRuntime {
  handleBlockDragOver: (view: EditorView, event: DragEvent) => boolean
  handleBlockDragStart: (view: EditorView, event: DragEvent) => boolean
  handleBlockDrop: (view: EditorView, event: DragEvent) => boolean
  handleBlockInsertKeydown: (event: KeyboardEvent) => void
}

export function createNanoGutterRuntime(ctx: NanoViewContext): NanoGutterRuntime {
  const drag = createNanoGutterDragRuntime(ctx)
  const keyboard = createNanoGutterKeyboardRuntime(ctx)

  return {
    handleBlockDragOver: drag.handleBlockDragOver,
    handleBlockDragStart: drag.handleBlockDragStart,
    handleBlockDrop: drag.handleBlockDrop,
    handleBlockInsertKeydown: keyboard.handleBlockInsertKeydown,
  }
}
