import { button } from './nano-view-toolbar-controls'
import { installToolbarBlockPicker } from './nano-view-toolbar-picker'
import { refreshToolbarState } from './nano-view-toolbar-state'
import type { BlockPickerMode, NanoViewContext } from './nano-view-context'
import type {
  NanoToolbarActions,
  NanoToolbarRuntime,
} from './nano-view-toolbar-types'

export type {
  NanoToolbarActions,
  NanoToolbarRuntime,
} from './nano-view-toolbar-types'

export function createNanoToolbarRuntime(
  ctx: NanoViewContext,
  actions: NanoToolbarActions,
): NanoToolbarRuntime {
  function installToolbar(): void {
    ctx.toolbar.replaceChildren(
      ...installToolbarBlockPicker(ctx, actions, toggleBlockPicker),
      button('↑', 'Move Up', () => actions.runMoveActiveBlock('up')),
      button('↓', 'Move Down', () => actions.runMoveActiveBlock('down')),
      button('⇥', 'Indent', () => actions.runIndentActiveBlock('in')),
      button('⇤', 'Outdent', () => actions.runIndentActiveBlock('out')),
      button('⧉', 'Duplicate', () => actions.runDuplicateActiveBlock()),
      button('⌫', 'Delete', () => actions.runDeleteActiveBlock()),
      button('</>', 'Source', () => actions.runFocusActiveMarkdownSource()),
      button('⎘', 'Copy', () => actions.copyMarkdown()),
      button('↶', 'Undo', () => actions.restoreHistory('undo')),
      button('↷', 'Redo', () => actions.restoreHistory('redo')),
    )
  }

  function toggleBlockPicker(mode: BlockPickerMode): void {
    if (!ctx.blockPicker.hidden && ctx.blockPickerMode === mode) {
      closeBlockPicker()
      return
    }

    ctx.blockPickerMode = mode
    ctx.blockPicker.hidden = false
    ctx.blockPicker.dataset.mode = mode
    ctx.blockPicker.ariaLabel = mode === 'insert' ? 'Add' : 'Change'
  }

  function closeBlockPicker(): void {
    ctx.blockPicker.hidden = true
  }

  return {
    closeBlockPicker,
    installToolbar,
    refreshToolbarState: () => refreshToolbarState(ctx),
    toggleBlockPicker,
  }
}
