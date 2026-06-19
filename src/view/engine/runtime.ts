import type { Transaction } from 'prosemirror-state'
import type { Pointer, SelectionSnap } from '@interactive-os/json-document'
import {
  nanoDocumentChangeFromProseMirrorDoc,
} from '../../adapters/prosemirror/prosemirror-document'
import { nanoSelectionFromProseMirror } from '../../adapters/prosemirror/prosemirror-selection'
import { commitNanoDocumentChange } from '../../entities/document/nano-document-change'
import { sourceRevealPluginKey } from '../../features/viewer-edit/source-reveal/state'
import {
  copyMarkdown,
  pruneCollapsedBlocks,
  refreshInspector,
  restoreHistory,
  syncEditorFromEngine,
  syncSelectionFromDOM,
  toggleCollapsedBlock,
  type NanoEngineDeps,
} from './sync'
import {
  TEXT_MERGE_MS,
  type NanoViewContext,
} from '../runtime/context'
import { nanoDocumentChangeTransactionMetadata } from './transaction-metadata'

export interface NanoEngineRuntime {
  copyMarkdown: () => void
  dispatchProseMirrorTransaction: (transaction: Transaction) => void
  refreshInspector: () => void
  restoreHistory: (direction: 'undo' | 'redo') => void
  syncEditorFromEngine: () => void
  syncSelectionFromDOM: () => void
  toggleCollapsedBlock: (id: string) => void
}

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

function createProseMirrorTransactionDispatcher(
  ctx: NanoViewContext,
  runtime: {
    refreshInspector: () => void
    syncEditorFromEngine: () => void
  },
): (transaction: Transaction) => void {
  return (transaction) => {
    const nextState = ctx.view.state.apply(transaction)
    if (transaction.docChanged) pruneCollapsedBlocks(ctx, nextState.doc)

    ctx.view.updateState(nextState)

    const selection = nanoSelectionFromProseMirror(nextState.doc, nextState.selection)
    if (!transaction.docChanged && transaction.getMeta(sourceRevealPluginKey)) return

    if (!transaction.docChanged) {
      restoreNanoSelection(ctx, selection)
      runtime.refreshInspector()
      return
    }

    const metadata = nanoDocumentChangeTransactionMetadata(transaction)
    const change = nanoDocumentChangeFromProseMirrorDoc(ctx.engine.value, nextState.doc, {
      label: metadata?.label ?? transactionLabel(transaction),
      origin: metadata?.origin,
      selection,
    })
    if (!change) {
      restoreNanoSelection(ctx, selection)
      runtime.refreshInspector()
      return
    }

    const committed = runWithoutEngineSync(ctx, () => commitNanoDocumentChange(ctx.engine, change))
    if (!committed.ok) {
      runtime.syncEditorFromEngine()
      return
    }

    coalesceTextHistory(ctx, change.mergePath ?? null)
    ctx.onLocalChange(change)
    runtime.refreshInspector()
  }
}

function runWithoutEngineSync<T>(ctx: NanoViewContext, fn: () => T): T {
  const previous = ctx.suppressEngineSync
  ctx.suppressEngineSync = true
  try {
    return fn()
  } finally {
    ctx.suppressEngineSync = previous
  }
}

function restoreNanoSelection(ctx: NanoViewContext, selection: SelectionSnap | null): void {
  if (selection) ctx.engine.selection?.restore(selection)
}

function coalesceTextHistory(ctx: NanoViewContext, path: Pointer | null): void {
  const now = Date.now()
  if (path && ctx.lastTextMergePath === path && now - ctx.lastTextMergeAt < TEXT_MERGE_MS) {
    ctx.engine.history.mergeLast({ mergeKey: `text:${path}` })
  }
  ctx.lastTextMergePath = path
  ctx.lastTextMergeAt = now
}

function transactionLabel(transaction: Transaction): string {
  const inputType = transaction.getMeta('inputType')
  return typeof inputType === 'string' ? inputType : 'edit'
}
