import type { BlockOption, BlockTemplate } from '../blocks/nano-block-options'
import type { MarkOption } from '../marks/nano-mark-options'
import type {
  CommandPaletteMode,
  IndentDirection,
  InspectorTab,
  MoveDirection,
} from '../view/nano-command-surface'

export interface NanoCommand {
  id: string
  title: string
  hint?: string
  keywords?: readonly string[]
  run: () => void
  isEnabled?: () => boolean
  isVisible?: () => boolean
}

export interface NanoCommandActions {
  changeBlockById: (id: string, template: BlockTemplate) => void
  copyMarkdown: () => void
  deleteBlock: () => void
  duplicateBlock: () => void
  focusMarkdownSource: () => void
  indentBlock: (direction: IndentDirection) => void
  insertBlock: (template: BlockTemplate) => void
  moveBlock: (direction: MoveDirection) => void
  redo: () => void
  runMark: (option: MarkOption) => void
  showInspector: (tab: InspectorTab) => void
  togglePinnedInspector: () => void
  undo: () => void
}

export interface NanoCommandsOptions {
  activeBlockId: string | null
  actions: NanoCommandActions
  blockId: string | null
  blockOptions?: readonly BlockOption[]
  canIndentBlock: (direction: IndentDirection) => boolean
  canMoveBlock: (direction: MoveDirection) => boolean
  hasTextSelection: boolean
  mode: CommandPaletteMode
}
