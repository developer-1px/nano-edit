import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import { footnoteName } from '../../core/nano-footnote'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'

export function footnoteMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (block.type.name !== nanoNodeNames.footnote || (text !== ':' && text !== ' ')) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset) return null

  const match = /^\[\^([^\]\s\r\n]+)\]:( ?)$/.exec(textBefore + text)
  if (!match) return null

  const name = footnoteName(match[1] ?? '')
  if (!name) return null

  const footnote = block.type.create({
    ...block.attrs,
    name,
    footnoteTextSpacing: match[2] === ' ' ? null : 'none',
  }, block.content.cut($from.parentOffset))
  const blockPosition = $from.before()
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, footnote)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}
