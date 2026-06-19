import { type Node as ProseMirrorNode } from 'prosemirror-model'
import { nanoBlocksFromProseMirror } from '../../adapters/prosemirror/prosemirror-document'
import {
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
  type NanoMarkdownBlockEntry,
} from '../../codecs/markdown/nano-markdown-serialize'
import { blockCollapseRanges } from '../../entities/block/structure/nano-block-collapse'
import {
  blockId,
  isListLikeNode,
} from '../../entities/block/structure/nano-block-node-kind'
import { blockSubtreeRanges } from '../../entities/block/structure/nano-block-ranges'
import type { ActiveBlockRange } from '../../entities/block/structure/nano-block-structure-types'
import { activeBlockId } from '../selection/active-block'
import type { NanoViewContext } from '../runtime/context'
import type { NanoInspectorNavigation } from './navigation'
import { markdownBlockSourceTransaction } from '../markdown-source/source-transaction'

type MarkdownSourceIndentDirection = 'in' | 'out'

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

function markdownBlockEntriesForView(
  doc: ProseMirrorNode,
  collapsedBlockIds: ReadonlySet<string>,
): NanoMarkdownBlockEntry[] {
  const entries: NanoMarkdownBlockEntry[] = []
  const markdownById = markdownByBlockId(doc)

  for (const range of blockCollapseRanges(doc, collapsedBlockIds)) {
    if (range.hidden) continue

    const id = blockId(range.node)
    if (!id) continue

    const ranges = range.collapsed ? blockSubtreeRanges(doc, range) : [range]
    entries.push({
      blockId: id,
      markdown: markdownForBlockRanges(doc, ranges, markdownById),
    })
  }

  return entries
}

function syncMarkdownSourceRows(editor: HTMLTextAreaElement): void {
  editor.rows = Math.max(1, editor.value.split('\n').length)
}

function indentMarkdownSourceLines(
  editor: HTMLTextAreaElement,
  direction: MarkdownSourceIndentDirection,
): void {
  const { value, selectionStart, selectionEnd } = editor
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const lineEnd = lineEndAfterSelection(value, selectionEnd)
  const before = value.slice(0, lineStart)
  const segment = value.slice(lineStart, lineEnd)
  const after = value.slice(lineEnd)
  const nextSegment = direction === 'in'
    ? segment.split('\n').map((line) => `  ${line}`).join('\n')
    : segment.split('\n').map(outdentedMarkdownLine).join('\n')

  editor.value = `${before}${nextSegment}${after}`
  editor.selectionStart = lineStart
  editor.selectionEnd = lineStart + nextSegment.length
  syncMarkdownSourceRows(editor)
}

function markdownForBlockRanges(
  doc: ProseMirrorNode,
  ranges: readonly ActiveBlockRange[],
  markdownById: ReadonlyMap<string, string> = markdownByBlockId(doc),
): string {
  let markdown = ''

  ranges.forEach((range, index) => {
    const previousRange = ranges[index - 1]
    if (previousRange) markdown += markdownBlockSeparator(previousRange.node, range.node)

    const id = blockId(range.node)
    markdown += (id ? markdownById.get(id) : null) ?? markdownForSingleBlockRange(doc, range)
  })

  return markdown
}

function markdownBlockSeparator(previous: ProseMirrorNode, next: ProseMirrorNode): string {
  return isListLikeNode(previous) && isListLikeNode(next) ? '\n' : '\n\n'
}

function markdownByBlockId(doc: ProseMirrorNode): Map<string, string> {
  const document = { blocks: nanoBlocksFromProseMirror(doc) }
  return new Map(nanoMarkdownBlocksFromDocument(document).map((entry) => [entry.blockId, entry.markdown]))
}

function markdownForSingleBlockRange(doc: ProseMirrorNode, range: ActiveBlockRange): string {
  const selectedDoc = doc.type.create(null, [range.node])
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(selectedDoc) })
}

function lineEndAfterSelection(value: string, selectionEnd: number): number {
  const nextLineBreak = value.indexOf('\n', selectionEnd)
  return nextLineBreak < 0 ? value.length : nextLineBreak
}

function outdentedMarkdownLine(line: string): string {
  if (line.startsWith('  ')) return line.slice(2)
  if (line.startsWith('\t')) return line.slice(1)
  if (line.startsWith(' ')) return line.slice(1)
  return line
}
