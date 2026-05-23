import type { BlockTemplate } from './nano-block-options'
import type { IndentDirection, MoveDirection } from './nano-command-surface'
import type { MarkOption } from './nano-mark-options'
import type { BlockPickerMode } from './nano-view-context'

export interface NanoToolbarActions {
  copyMarkdown: () => void
  restoreHistory: (direction: 'undo' | 'redo') => void
  runBlockTemplate: (template: BlockTemplate) => void
  runBlockPickerTemplate: (template: BlockTemplate) => void
  runDeleteActiveBlock: () => void
  runDuplicateActiveBlock: () => void
  runFocusActiveMarkdownSource: () => void
  runIndentActiveBlock: (direction: IndentDirection) => void
  runMarkCommand: (option: MarkOption) => void
  runMoveActiveBlock: (direction: MoveDirection) => void
}

export interface NanoToolbarRuntime {
  closeBlockPicker: () => void
  installToolbar: () => void
  refreshToolbarState: () => void
  toggleBlockPicker: (mode: BlockPickerMode) => void
}
