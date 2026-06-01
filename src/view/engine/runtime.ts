import { createProseMirrorTransactionDispatcher } from './dispatch'
import {
  copyMarkdown,
  refreshInspector,
  restoreHistory,
  syncEditorFromEngine,
  syncSelectionFromDOM,
  toggleCollapsedBlock,
} from './sync'
import type { NanoViewContext } from '../runtime/context'
import type {
  NanoEngineDeps,
  NanoEngineRuntime,
} from './types'

export type {
  NanoEngineDeps,
  NanoEngineRuntime,
} from './types'

export function createNanoEngineRuntime(
  ctx: NanoViewContext,
  deps: NanoEngineDeps,
): NanoEngineRuntime {
  const runtime = {
    refreshInspector: () => refreshInspector(ctx, deps),
    syncEditorFromEngine: () => syncEditorFromEngine(ctx, deps),
  }
  return {
    copyMarkdown: () => copyMarkdown(ctx),
    dispatchProseMirrorTransaction: createProseMirrorTransactionDispatcher(ctx, runtime),
    refreshInspector: runtime.refreshInspector,
    restoreHistory: (direction) => restoreHistory(ctx, runtime.syncEditorFromEngine, direction),
    syncEditorFromEngine: runtime.syncEditorFromEngine,
    syncSelectionFromDOM: () => syncSelectionFromDOM(ctx),
    toggleCollapsedBlock: (id) => toggleCollapsedBlock(ctx, id),
  }
}
