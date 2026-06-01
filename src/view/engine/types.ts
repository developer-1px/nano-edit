import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { Transaction } from 'prosemirror-state'
import type { NanoViewContext } from '../runtime/context'
import type { NanoInspectorRuntime } from '../inspector/runtime'

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
}
