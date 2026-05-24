import type { EditorState } from 'prosemirror-state'
import {
  blockCollapseRanges,
  selectedWholeBlockRanges,
} from './nano-block-structure'
import { nanoMarkdownFromDocument } from './nano-markdown'
import { nanoBlocksFromProseMirror } from './prosemirror-nano'

export function markdownCopyTextFromSelection(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): string | null {
  const inlineMarkdown = selectedInlineMarkdown(state)
  if (inlineMarkdown) return inlineMarkdown

  const ranges = selectedWholeBlockRanges(state, collapsedBlockIds)
  if (ranges.length === 0) return selectedPartialBlockMarkdown(state, collapsedBlockIds)

  const selectedDoc = state.schema.nodes.doc.create(null, ranges.map((range) => range.node))
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(selectedDoc) })
}

function selectedInlineMarkdown(state: EditorState): string | null {
  const { selection } = state
  if (selection.empty || !selection.$from.sameParent(selection.$to)) return null

  const parent = selection.$from.parent
  if (!parent.isTextblock) return null

  const paragraphType = state.schema.nodes.paragraph
  if (!paragraphType) return null

  const content = parent.content.cut(selection.$from.parentOffset, selection.$to.parentOffset)
  if (content.size === 0) return null

  const doc = state.schema.nodes.doc.create(null, [
    paragraphType.create({ id: 'copied-inline' }, content),
  ])
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(doc) })
}

function selectedPartialBlockMarkdown(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string>,
): string | null {
  const { selection } = state
  if (selection.empty || selection.$from.sameParent(selection.$to)) return null

  const nodes = blockCollapseRanges(state.doc, collapsedBlockIds)
    .filter((range) => !range.hidden && range.to > selection.from && range.from < selection.to)
    .map((range) => {
      if (!range.node.isTextblock) return range.node

      const contentFrom = range.from + 1
      const from = Math.max(0, Math.min(range.node.content.size, selection.from - contentFrom))
      const to = Math.max(0, Math.min(range.node.content.size, selection.to - contentFrom))
      return range.node.copy(range.node.content.cut(from, to))
    })

  if (nodes.length === 0) return null

  const doc = state.schema.nodes.doc.create(null, nodes)
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(doc) })
}
