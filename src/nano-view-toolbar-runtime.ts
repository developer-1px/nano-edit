import {
  ArrowDown,
  ArrowUp,
  Copy as CopyIcon,
  CopyPlus,
  FileCode2,
  IndentDecrease,
  IndentIncrease,
  Redo2,
  Trash2,
  Undo2,
} from 'lucide'
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
      button('', 'Move Up', () => actions.runMoveActiveBlock('up'), ArrowUp),
      button('', 'Move Down', () => actions.runMoveActiveBlock('down'), ArrowDown),
      button('', 'Indent', () => actions.runIndentActiveBlock('in'), IndentIncrease),
      button('', 'Outdent', () => actions.runIndentActiveBlock('out'), IndentDecrease),
      button('', 'Duplicate', () => actions.runDuplicateActiveBlock(), CopyPlus),
      button('', 'Delete', () => actions.runDeleteActiveBlock(), Trash2),
      button('', 'Source', () => actions.runFocusActiveMarkdownSource(), FileCode2),
      button('', 'Copy', () => actions.copyMarkdown(), CopyIcon),
      button('', 'Undo', () => actions.restoreHistory('undo'), Undo2),
      button('', 'Redo', () => actions.restoreHistory('redo'), Redo2),
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
