import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../assembly/capability'
import { atxSpacing } from '../adapters/prosemirror/prosemirror-block-attrs'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-nano'

export function toggleCheckedBlockTransaction(
  state: EditorState,
  position: number,
): Transaction | null {
  const node = state.doc.nodeAt(position)
  if (!node) return null

  return state.tr.setNodeMarkup(position, node.type, {
    ...node.attrs,
    checked: node.attrs.checked !== true,
  })
}

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

export function decreaseHeadingAtStartThenParagraph(context: BlockKeyboardContext): Transaction | null {
  if (context.$from.parentOffset !== 0) return null

  const level = typeof context.block.attrs.level === 'number' ? context.block.attrs.level : 1
  if (context.block.attrs.headingStyle === 'setext') {
    return setParagraphTransaction(context.state, context.blockPosition, context.block.attrs.id)
  }

  const textSpacing = atxSpacing(context.block.attrs.atxTextSpacing)
  if (textSpacing > 1) {
    const transaction = context.state.tr.setNodeMarkup(context.blockPosition, context.block.type, {
      ...context.block.attrs,
      atxTextSpacing: textSpacing > 2 ? textSpacing - 1 : null,
    })
    transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
    return transaction
  }

  if (level <= 1) return setParagraphTransaction(context.state, context.blockPosition, context.block.attrs.id)

  const transaction = context.state.tr.setNodeMarkup(context.blockPosition, context.block.type, {
    ...context.block.attrs,
    level: level - 1,
    headingStyle: 'atx',
    atxClosingLength: null,
    atxClosingSpacing: null,
  })
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
  return transaction
}

export function setParagraphTransaction(
  state: BlockKeyboardContext['state'],
  blockPosition: number,
  id: unknown,
): Transaction | null {
  const source = state.doc.nodeAt(blockPosition)
  const paragraphType = state.schema.nodes[nanoNodeNames.paragraph]
  if (!source || !paragraphType) return null

  const paragraph = paragraphType.create({ id }, source.isTextblock ? source.content : null)
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + source.nodeSize, paragraph)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}
