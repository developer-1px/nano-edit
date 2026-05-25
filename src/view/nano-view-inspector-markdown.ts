import type { NanoMarkdownBlockEntry } from '../codecs/markdown/nano-markdown'
import {
  indentMarkdownSourceLines,
  markdownBlockEntriesForView,
  syncMarkdownSourceRows,
} from './nano-view-markdown'
import { activeBlockId } from './nano-view-active-block'
import type { NanoViewContext } from './nano-view-context'
import type { NanoInspectorNavigation } from './nano-view-inspector-navigation'
import { markdownBlockSourceTransaction } from './nano-view-markdown-transactions'

export function createNanoInspectorMarkdownRuntime(ctx: NanoViewContext, navigation: NanoInspectorNavigation) {
  const renderMarkdown = (): void => {
    const activeId = activeBlockId(ctx.view.state)
    const entries = markdownBlockEntriesForView(ctx.view.state.doc, ctx.collapsedBlockIds)
    ctx.markdownOutput.replaceChildren(...entries.map((entry) => markdownBlockControl(ctx, navigation, entry, activeId)))
  }

  const focusActiveMarkdownSource = (): boolean => {
    const activeId = activeBlockId(ctx.view.state)
    if (!activeId) return false

    ctx.shell.showInspector('markdown')
    renderMarkdown()
    const editor = activeMarkdownSourceEditor(ctx.markdownOutput, activeId)
    if (!editor) return false

    editor.focus()
    return true
  }

  return { focusActiveMarkdownSource, renderMarkdown }
}

function activeMarkdownSourceEditor(output: HTMLElement, blockId: string): HTMLTextAreaElement | null {
  const editor = output.querySelector<HTMLTextAreaElement>('textarea[data-active="true"]')
  return editor?.dataset.blockId === blockId ? editor : null
}

function markdownBlockControl(
  ctx: NanoViewContext,
  navigation: NanoInspectorNavigation,
  entry: NanoMarkdownBlockEntry,
  activeId: string | null,
): HTMLElement {
  if (entry.blockId === activeId) return markdownBlockEditor(ctx, entry)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano-markdown-block'
  button.textContent = entry.markdown
  button.title = entry.blockId
  button.ariaLabel = `${entry.blockId} source`
  button.dataset.active = 'false'
  button.dataset.blockId = entry.blockId
  button.addEventListener('click', () => navigation.selectBlockById(entry.blockId))
  return button
}

function markdownBlockEditor(ctx: NanoViewContext, entry: NanoMarkdownBlockEntry): HTMLTextAreaElement {
  const editor = document.createElement('textarea')
  editor.className = 'nano-markdown-block'
  editor.value = entry.markdown
  syncMarkdownSourceRows(editor)
  editor.spellcheck = false
  editor.title = entry.blockId
  editor.ariaLabel = `${entry.blockId} source`
  editor.dataset.active = 'true'
  editor.dataset.blockId = entry.blockId
  editor.addEventListener('input', () => syncMarkdownSourceRows(editor))
  editor.addEventListener('blur', () => applyMarkdownBlockSource(ctx, entry.blockId, editor.value))
  editor.addEventListener('keydown', (event) => handleMarkdownEditorKeydown(ctx, entry, editor, event))
  return editor
}

function handleMarkdownEditorKeydown(
  ctx: NanoViewContext,
  entry: NanoMarkdownBlockEntry,
  editor: HTMLTextAreaElement,
  event: KeyboardEvent,
): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    resetMarkdownSourceEditor(editor, entry.markdown)
    ctx.view.focus()
    return
  }
  if (event.key === 'Tab') {
    event.preventDefault()
    indentMarkdownSourceLines(editor, event.shiftKey ? 'out' : 'in')
    return
  }
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    applyMarkdownBlockSource(ctx, entry.blockId, editor.value)
    ctx.view.focus()
  }
}

function applyMarkdownBlockSource(ctx: NanoViewContext, id: string, markdown: string): void {
  const current = markdownBlockEntriesForView(ctx.view.state.doc, ctx.collapsedBlockIds)
    .find((entry) => entry.blockId === id)
  if (current?.markdown === markdown) return

  const transaction = markdownBlockSourceTransaction(ctx.view.state, id, markdown, ctx.collapsedBlockIds)
  if (transaction) ctx.view.dispatch(transaction.scrollIntoView())
}

function resetMarkdownSourceEditor(editor: HTMLTextAreaElement, markdown: string): void {
  editor.value = markdown
  syncMarkdownSourceRows(editor)
}
