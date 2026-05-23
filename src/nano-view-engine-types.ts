import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { Transaction } from 'prosemirror-state'
import type { NanoViewContext } from './nano-view-context'
import type { NanoInspectorRuntime } from './nano-view-inspector-runtime'
import type { NanoToolbarRuntime } from './nano-view-toolbar-runtime'

export interface NanoEngineRuntime {
  copyMarkdown: () => void
  dispatchProseMirrorTransaction: (transaction: Transaction) => void
  refreshInspector: () => void
  restoreHistory: (direction: 'undo' | 'redo') => void
  syncEditorFromEngine: () => void
  syncSelectionFromDOM: () => void
  toggleCollapsedBlock: (id: string) => void
}

export interface NanoEngineDeps {
  createEditorState: (doc?: ProseMirrorNode) => Parameters<NanoViewContext['view']['updateState']>[0]
  inspector: NanoInspectorRuntime
  syncGutterPickerWithSelection: (state: Parameters<NanoViewContext['view']['updateState']>[0]) => void
  toolbar: NanoToolbarRuntime
}
