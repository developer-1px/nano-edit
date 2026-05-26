import type { Transaction } from 'prosemirror-state'
import type { Pointer, SelectionSnap } from 'zod-crud'
import {
  nanoDocumentFromProseMirror,
  nanoPatchFromDocuments,
  nanoSelectionFromProseMirror,
  textMergePathForDocuments,
} from '../adapters/prosemirror/prosemirror-nano'
import {
  TEXT_MERGE_MS,
  type NanoViewContext,
} from './nano-view-context'
import { pruneCollapsedBlocks } from './nano-view-engine-sync'
import { sourceRevealPluginKey } from './nano-source-reveal-plugin'

export function createProseMirrorTransactionDispatcher(
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

    const nextDocument = nanoDocumentFromProseMirror(nextState.doc)
    const patch = nanoPatchFromDocuments(ctx.engine.value, nextState.doc)
    if (patch.length === 0) {
      restoreNanoSelection(ctx, selection)
      runtime.refreshInspector()
      return
    }

    const mergePath = textMergePathForDocuments(ctx.engine.value, nextDocument)
    const committed = ctx.engine.commit(patch, {
      label: transactionLabel(transaction),
      origin: 'prosemirror-view',
      mergeKey: mergePath ? `text:${mergePath}` : undefined,
      selection: selection ?? undefined,
    })
    if (!committed.ok) {
      runtime.syncEditorFromEngine()
      return
    }

    coalesceTextHistory(ctx, mergePath)
    runtime.refreshInspector()
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
