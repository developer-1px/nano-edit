import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, type Transaction } from 'prosemirror-state'
import {
  generatedBlockId,
  type BlockOptionRegistry,
  type BlockTemplate,
} from '../blocks/nano-block-options'
import { selectionAfterInsertedContent } from '../core/nano-selection'
import {
  insertedContentForShortcutTemplate,
  selectionAfterMarkdownLineEnter,
} from './nano-view-block-template-nodes'
import { templateText } from './nano-view-block-template-markdown'

export function blockShortcutTransactionForTemplate(
  state: EditorState,
  $from: ResolvedPos,
  template: BlockTemplate,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = $from.parent
  const blockPosition = $from.before()
  const id = typeof block.attrs.id === 'string' && block.attrs.id ? block.attrs.id : generatedBlockId('b', 'shortcut')
  const inserted = insertedContentForShortcutTemplate(state.doc, template, id, registry)
  if (!inserted) return null

  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, inserted)
  transaction.setSelection(templateText(template) === null
    ? selectionAfterInsertedContent(transaction.doc, blockPosition, inserted)
    : selectionAfterMarkdownLineEnter(transaction.doc, blockPosition, inserted))
  return transaction
}
