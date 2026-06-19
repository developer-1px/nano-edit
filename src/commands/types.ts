import type { BlockOption, BlockTemplate } from '../assembly/capability'
import type { MarkOption } from '../marks/types'

export type IndentDirection = 'in' | 'out'
export type MoveDirection = 'down' | 'up'
export type InspectorTab = 'index' | 'markdown'
export type CommandPaletteMode = 'global' | 'slash'

export interface NanoCommandContext {
  blockId: string | null
  mode: CommandPaletteMode
}

export interface NanoCommand {
  id: string
  title: string
  hint?: string
  keywords?: readonly string[]
  run: () => void
  isEnabled?: () => boolean
  isVisible?: () => boolean
}

interface NanoCommandActions {
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
