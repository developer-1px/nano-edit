import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, type Transaction } from 'prosemirror-state'
import type { BlockTemplate } from '../../assembly/capability'
import type { BlockOptionRegistry } from '../../blocks/nano-block-options'
import { generatedBlockId } from '../../capabilities/block-behavior-id'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import { selectionAfterInsertedContent } from '../selection/placement'
import {
  insertedContentForShortcutTemplate,
  selectionAfterMarkdownLineEnter,
} from './nodes'
import { templateText } from './markdown'

export function blockShortcutTransactionForTemplate(
  state: EditorState,
  $from: ResolvedPos,
  template: BlockTemplate,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = $from.parent
  const blockPosition = $from.before()
  const id = blockId(block) || generatedBlockId(null, 'shortcut')
  const inserted = insertedContentForShortcutTemplate(state.doc, template, id, registry)
  if (!inserted) return null

  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, inserted)
  transaction.setSelection(templateText(template) === null
    ? selectionAfterInsertedContent(transaction.doc, blockPosition, inserted)
    : selectionAfterMarkdownLineEnter(transaction.doc, blockPosition, inserted))
  return transaction
}
