import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { NodeSelection, TextSelection } from 'prosemirror-state'
import { collapsibleBlockIds } from '../../blocks/nano-block-structure'
import { nanoMarkdownFromDocument } from '../../codecs/markdown/nano-markdown'
import { prosemirrorDocFromNano } from '../../adapters/prosemirror/prosemirror-nano'
import { writeClipboardText } from '../clipboard/index'
import type { NanoViewContext } from '../runtime/context'
import type { NanoEngineDeps } from './types'

export function syncSelectionFromDOM(ctx: NanoViewContext): void {
  if (ctx.view.state.selection instanceof NodeSelection) return

  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !selection.focusNode) return
  if (!ctx.view.dom.contains(selection.anchorNode) || !ctx.view.dom.contains(selection.focusNode)) return

  try {
    const anchor = ctx.view.posAtDOM(selection.anchorNode, selection.anchorOffset)
    const focus = ctx.view.posAtDOM(selection.focusNode, selection.focusOffset)
    const nextSelection = TextSelection.create(ctx.view.state.doc, anchor, focus)
    if (nextSelection.eq(ctx.view.state.selection)) return
    ctx.view.dispatch(ctx.view.state.tr.setSelection(nextSelection))
  } catch {
    // Ignore transient browser selections that ProseMirror cannot map.
  }
}

export function restoreHistory(
  ctx: NanoViewContext,
  syncEditorFromEngine: () => void,
  direction: 'undo' | 'redo',
): void {
  const restored = direction === 'undo' ? ctx.engine.history.undo() : ctx.engine.history.redo()
  if (restored) syncEditorFromEngine()
}

export function syncEditorFromEngine(ctx: NanoViewContext, deps: NanoEngineDeps): void {
  const doc = prosemirrorDocFromNano(ctx.engine.value)
  pruneCollapsedBlocks(ctx, doc)
  ctx.view.updateState(deps.createEditorState(doc))
  refreshInspector(ctx, deps)
}

export function toggleCollapsedBlock(ctx: NanoViewContext, id: string): void {
  if (ctx.collapsedBlockIds.has(id)) {
    ctx.collapsedBlockIds.delete(id)
  } else {
    ctx.collapsedBlockIds.add(id)
  }
  ctx.view.dispatch(ctx.view.state.tr.setMeta('nano-block-collapse', id))
}

export function copyMarkdown(ctx: NanoViewContext): void {
  void writeClipboardText(nanoMarkdownFromDocument(ctx.engine.value)).catch(() => undefined)
}

export function refreshInspector(_ctx: NanoViewContext, deps: NanoEngineDeps): void {
  deps.inspector.renderIndex()
  deps.inspector.renderMarkdown()
}

export function pruneCollapsedBlocks(ctx: NanoViewContext, doc: ProseMirrorNode): void {
  const collapsibleIds = collapsibleBlockIds(doc)
  for (const id of ctx.collapsedBlockIds) {
    if (!collapsibleIds.has(id)) ctx.collapsedBlockIds.delete(id)
  }
}
