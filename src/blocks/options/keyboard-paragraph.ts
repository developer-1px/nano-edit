import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../../assembly/capability'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-nano'

export function exitEmptyThen(
  action: (context: BlockKeyboardContext) => Transaction | null,
): (context: BlockKeyboardContext) => Transaction | null {
  return (context) => {
    if (context.block.textContent.length === 0) {
      return setParagraphTransaction(context.state, context.blockPosition, context.block.attrs.id)
    }
    return action(context)
  }
}

export function convertBlockToParagraphAtStart(context: BlockKeyboardContext): Transaction | null {
  if (context.$from.parentOffset !== 0) return null
  return setParagraphTransaction(context.state, context.blockPosition, context.block.attrs.id)
}

export function setParagraphTransaction(state: EditorState, blockPosition: number, id: unknown): Transaction | null {
  const source = state.doc.nodeAt(blockPosition)
  const paragraphType = state.schema.nodes[nanoNodeNames.paragraph]
  if (!source || !paragraphType) return null

  const paragraph = paragraphType.create({ id }, source.isTextblock ? source.content : null)
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + source.nodeSize, paragraph)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}
