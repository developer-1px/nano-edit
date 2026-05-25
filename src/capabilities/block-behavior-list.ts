import { TextSelection, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../assembly/capability'
import {
  shiftedContinuationIndents,
  shiftedRawIndent,
} from '../core/nano-source-metadata'
import { blockIndent } from './block-behavior-values'
import {
  convertBlockToParagraphAtStart,
  setParagraphTransaction,
} from './block-behavior-paragraph'

export function outdentEmptyListBlockThen(
  action: (context: BlockKeyboardContext) => Transaction | null,
): (context: BlockKeyboardContext) => Transaction | null {
  return (context) => {
    if (context.block.textContent.length > 0) return action(context)

    const indent = blockIndent(context.block.attrs)
    if (indent <= 0) return setParagraphTransaction(context.state, context.blockPosition, context.block.attrs.id)

    return outdentListBlock(context)
  }
}

export function outdentListBlockAtStartThenParagraph(context: BlockKeyboardContext): Transaction | null {
  if (context.$from.parentOffset !== 0) return null

  const indent = blockIndent(context.block.attrs)
  if (indent <= 0) return convertBlockToParagraphAtStart(context)

  return outdentListBlock(context)
}

function outdentListBlock(context: BlockKeyboardContext): Transaction {
  const indent = blockIndent(context.block.attrs)
  const transaction = context.state.tr.setNodeMarkup(context.blockPosition, context.block.type, {
    ...context.block.attrs,
    indent: indent - 1,
    indentText: shiftedRawIndent(context.block.attrs.indentText, -1),
    continuationIndents: shiftedContinuationIndents(context.block.attrs.continuationIndents, -1),
  })
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
  return transaction
}
