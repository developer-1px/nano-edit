import type { EditorState } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import type { BlockTemplate } from './nano-block-options'
import type { GutterPickerAction } from './nano-block-ui'
import type { NanoViewContext } from './nano-view-context'
import { createNanoGutterClickRuntime } from './nano-view-gutter-click-runtime'
import { createNanoGutterDragRuntime } from './nano-view-gutter-drag-runtime'
import { createNanoGutterKeyboardRuntime } from './nano-view-gutter-keyboard-runtime'
import { createNanoGutterPickerRuntime } from './nano-view-gutter-picker-runtime'

export interface NanoGutterRuntime {
  closeGutterPicker: (refresh?: boolean) => void
  handleBlockAddClick: (event: MouseEvent) => void
  handleBlockDragOver: (view: EditorView, event: DragEvent) => boolean
  handleBlockDragStart: (view: EditorView, event: DragEvent) => boolean
  handleBlockDrop: (view: EditorView, event: DragEvent) => boolean
  handleBlockHandleClick: (event: MouseEvent) => void
  handleBlockInsertHover: (event: MouseEvent) => void
  handleBlockInsertKeydown: (event: KeyboardEvent) => void
  handleGutterOutsideClick: (event: MouseEvent) => void
  refreshBlockUi: () => void
  runGutterPickerAction: (id: string, template: BlockTemplate, action: GutterPickerAction) => boolean
  syncGutterPickerWithSelection: (state: EditorState) => void
}

export function createNanoGutterRuntime(ctx: NanoViewContext): NanoGutterRuntime {
  const picker = createNanoGutterPickerRuntime(ctx)
  const click = createNanoGutterClickRuntime(ctx, picker)
  const drag = createNanoGutterDragRuntime(ctx, picker)
  const keyboard = createNanoGutterKeyboardRuntime(ctx, picker)

  return {
    closeGutterPicker: picker.closeGutterPicker,
    handleBlockAddClick: click.handleBlockAddClick,
    handleBlockDragOver: drag.handleBlockDragOver,
    handleBlockDragStart: drag.handleBlockDragStart,
    handleBlockDrop: drag.handleBlockDrop,
    handleBlockHandleClick: click.handleBlockHandleClick,
    handleBlockInsertHover: click.handleBlockInsertHover,
    handleBlockInsertKeydown: keyboard.handleBlockInsertKeydown,
    handleGutterOutsideClick: click.handleGutterOutsideClick,
    refreshBlockUi: picker.refreshBlockUi,
    runGutterPickerAction: picker.runGutterPickerAction,
    syncGutterPickerWithSelection: picker.syncGutterPickerWithSelection,
  }
}
