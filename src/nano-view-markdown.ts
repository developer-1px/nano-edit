import { type Node as ProseMirrorNode } from 'prosemirror-model'
import {
  blockCollapseRanges,
  blockId,
  blockSubtreeRanges,
  isListLikeNode,
  type ActiveBlockRange,
} from './nano-block-structure'
import {
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
  type NanoMarkdownBlockEntry,
} from './nano-markdown'
import { nanoBlocksFromProseMirror } from './prosemirror-nano'

type MarkdownSourceIndentDirection = 'in' | 'out'

export function markdownBlockEntriesForView(
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

export function syncMarkdownSourceRows(editor: HTMLTextAreaElement): void {
  editor.rows = Math.max(1, editor.value.split('\n').length)
}

export function indentMarkdownSourceLines(
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
    if (index > 0) markdown += markdownBlockSeparator(ranges[index - 1]!.node, range.node)

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
