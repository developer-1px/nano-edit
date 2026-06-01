import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import {
  blockAcceptsInputHints,
  type BlockOptionRegistry,
} from '../../blocks/nano-block-options'
import type { NanoDocument } from '../../core/nano-core'
import { nanoDocumentFromMarkdown } from '../../codecs/markdown/nano-markdown'
import { prosemirrorDocFromNano } from '../../adapters/prosemirror/prosemirror-nano'
import { selectionAfterInsertedContent } from '../../core/nano-selection'
import { inlineSourceTokenTextInputTransaction } from '../keyboard/inline-boundary'
import { topLevelReplacementRange } from './replacement-range'

export function markdownPasteTransaction(
  state: EditorState,
  markdown: string,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
  registry?: BlockOptionRegistry,
): Transaction | null {
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
