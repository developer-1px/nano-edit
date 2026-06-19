import type { EditorView } from 'prosemirror-view'
import type { Pointer } from '@interactive-os/json-document'
import type { BlockOptionRegistry } from '../../blocks/nano-block-options'
import type { NanoDocumentEngine } from '../../entities/document/nano-document'
import type { NanoDocumentChange } from '../../entities/document/nano-document-change'
import type { NanoEditorKit } from '../../engine/editor-kit'
import type { NanoShell } from '../shell/shell'
import type { NanoCustomBlockDescriptor } from './types'

export const TEXT_MERGE_MS = 600
export const COMPOSITION_SHORTCUT_SUPPRESSION_MS = 100

export interface NanoViewContext {
  engine: NanoDocumentEngine
  kit: NanoEditorKit
  blockRegistry: BlockOptionRegistry
  customBlocks: readonly NanoCustomBlockDescriptor[]
  root: HTMLElement
  editor: HTMLElement
  shell: NanoShell
  indexOutput: HTMLElement
  markdownOutput: HTMLElement
  onLocalChange: (change: NanoDocumentChange) => void
  view: EditorView
  destroyed: boolean
  engineUnsubscribe: (() => void) | null
  suppressEngineSync: boolean
  composing: boolean
  lastCompositionAt: number
  lastTextMergePath: Pointer | null
  lastTextMergeAt: number
  indexSearchQuery: string
  collapsedBlockIds: Set<string>
  slashKeydownListener: (event: KeyboardEvent) => void
}
