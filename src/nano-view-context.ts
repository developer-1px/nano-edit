import type { EditorView } from 'prosemirror-view'
import type { Pointer } from 'zod-crud'
import type { NanoDocumentEngine } from './nano-core'
import type { NanoShell } from './nano-command-surface'

export const TEXT_MERGE_MS = 600
export const BLOCK_DRAG_MIME = 'application/x-nano-block-id'

export type BlockPickerMode = 'convert' | 'insert'

export interface NanoViewOptions {
  mount: HTMLElement
  engine: NanoDocumentEngine
}

export interface NanoViewHandle {
  destroy(): void
}

export interface NanoViewContext {
  engine: NanoDocumentEngine
  root: HTMLElement
  toolbar: HTMLElement
  blockPicker: HTMLElement
  editor: HTMLElement
  shell: NanoShell
  indexOutput: HTMLElement
  markdownOutput: HTMLElement
  view: EditorView
  destroyed: boolean
  lastTextMergePath: Pointer | null
  lastTextMergeAt: number
  indexSearchQuery: string
  blockPickerMode: BlockPickerMode
  collapsedBlockIds: Set<string>
  slashKeydownListener: (event: KeyboardEvent) => void
}
