import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import {
  blockAcceptsInputHints,
  type BlockOptionRegistry,
} from '../../blocks/nano-block-options'
import {
  activeBlockRange,
  topLevelBlockRanges,
} from '../../entities/block/structure/nano-block-ranges'
import {
  expandedBlockRangesWithCollapsedSubtrees,
  selectedBlockRangesWithCollapsedSubtree,
} from '../../entities/block/structure/nano-block-selection-ranges'
import type { NanoDocument } from '../../entities/document/nano-document-model'
import { nanoDocumentFromMarkdown } from '../../codecs/markdown/nano-markdown-parse'
import { prosemirrorDocFromNano } from '../../adapters/prosemirror/prosemirror-document'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { selectionAfterInsertedContent } from '../selection/placement'
import { inlineSourceTokenTextInputTransaction } from '../keyboard/inline-boundary'

export function markdownPasteTransaction(
  state: EditorState,
  markdown: string,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
  registry?: BlockOptionRegistry,
): Transaction | null {
  const codeBlockTransaction = codeBlockPasteTransaction(state, markdown)
  if (codeBlockTransaction) return codeBlockTransaction

  if (!markdown.trim()) return null

  if (!markdown.includes('\n')) {
    const sourceTokenTransaction = inlineSourceTokenTextInputTransaction(
      state,
      state.selection.from,
      state.selection.to,
      markdown,
    )
    if (sourceTokenTransaction) return sourceTokenTransaction
  }

  const document = nanoDocumentFromMarkdown(markdown)
  const inlineTransaction = inlineMarkdownPasteTransaction(state, document, registry)
  if (inlineTransaction) return inlineTransaction

  if (!isStructuredBlockMarkdownPaste(document)) return null

  const replacement = prosemirrorDocFromNano(document).content
  const range = topLevelReplacementRange(state, collapsedBlockIds)
  if (!range || replacement.size === 0) return null

  const transaction = state.tr.replaceWith(range.from, range.to, replacement)
  transaction.setSelection(selectionAfterInsertedContent(transaction.doc, range.from, replacement))
  return transaction
}

function codeBlockPasteTransaction(state: EditorState, text: string): Transaction | null {
  if (text.length === 0) return null

  const { selection } = state
  if (!selection.$from.sameParent(selection.$to)) return null

  const block = selection.$from.parent
  if (block.type.name !== nanoNodeNames.codeBlock) return null

  const inserted = state.schema.text(text)
  const transaction = state.tr.replaceWith(selection.from, selection.to, inserted)
  transaction.setSelection(TextSelection.create(transaction.doc, selection.from + text.length))
  transaction.setMeta('inputType', 'codeBlockPaste')
  return transaction
}

function inlineMarkdownPasteTransaction(
  state: EditorState,
  document: NanoDocument,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = document.blocks[0]
  if (document.blocks.length !== 1 || block?.type !== 'paragraph' || block.marks.length === 0) return null

  const { selection } = state
  if (!selection.$from.sameParent(selection.$to)) return null

  const targetBlock = selection.$from.parent
  const acceptsInputHints = registry
    ? registry.blockAcceptsInputHints(targetBlock)
    : blockAcceptsInputHints(targetBlock)
  if (!targetBlock.isTextblock || !acceptsInputHints) return null

  const sourceBlock = prosemirrorDocFromNano(document).firstChild
  if (!sourceBlock || sourceBlock.content.size === 0) return null

  const transaction = state.tr.replaceWith(selection.from, selection.to, sourceBlock.content)
  transaction.setSelection(TextSelection.create(transaction.doc, selection.from + sourceBlock.content.size))
  return transaction
}

function isStructuredBlockMarkdownPaste(document: NanoDocument): boolean {
  if (document.blocks.length > 1) return true

  const block = document.blocks[0]
  return block !== undefined && block.type !== 'paragraph'
}

function topLevelReplacementRange(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): { from: number; to: number } | null {
  if (state.selection.empty) {
    const block = activeBlockRange(state)
    if (!block) return null

    const ranges = selectedBlockRangesWithCollapsedSubtree(state.doc, block, collapsedBlockIds)
    const last = ranges[ranges.length - 1]
    return last ? { from: block.from, to: last.to } : { from: block.from, to: block.to }
  }

  const ranges = topLevelBlockRanges(state.doc).filter((block) =>
    block.to > state.selection.from && block.from < state.selection.to,
  )
  const first = ranges[0]
  const last = ranges[ranges.length - 1]
  if (!first || !last) return null

  const expandedRanges = expandedBlockRangesWithCollapsedSubtrees(state.doc, ranges, collapsedBlockIds)
  const expandedLast = expandedRanges[expandedRanges.length - 1]
  return expandedLast ? { from: first.from, to: expandedLast.to } : { from: first.from, to: last.to }
}
